from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
import logging
import uuid

import razorpay
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models import Sum, Q, Max
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

User = get_user_model()

logger = logging.getLogger("store")

from .models import Product, Category, Cart, CartItem, Order, OrderItem, Rating, ProductImage
from .pagination import ProductPagination
from .permissions import IsAdminOrSuperAdmin
from .serializers import (
    ProductSerializer,
    CategorySerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    CategoryWriteSerializer,
    ProductWriteSerializer,
    CartSerializer,
    CartItemSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
    DashboardStatsSerializer,
    RatingSerializer,
    RatingWriteSerializer,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken


class CustomTokenObtainPairView(TokenObtainPairView):
    """JWT login that returns user profile info alongside tokens."""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(["POST"])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    user = User.objects.filter(email__iexact=email).first()

    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

        try:
            send_mail(
                subject="Reset Your Password",
                message=f"Click the link below to reset your password:\n\n{reset_link}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Failed to send password-reset email to %s", email)

    return Response(
        {"message": "If an account exists for that email, a reset link has been sent."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    uidb64 = serializer.validated_data["uid"]
    token = serializer.validated_data["token"]

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is None or not default_token_generator.check_token(user, token):
        return Response(
            {"error": "This reset link is invalid or has expired."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(serializer.validated_data["password"])
    user.save()

    return Response({"message": "Password has been reset successfully."})


@api_view(["GET"])
def get_products(request):
    products = Product.objects.all()

    search = request.query_params.get('search', '').strip()
    if search:
        products = products.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )

    category_slug = request.query_params.get('category', '').strip()
    if category_slug and category_slug != 'all':
        selected = Category.objects.filter(slug=category_slug).first()
        if selected is not None:
            products = products.filter(category__name__iexact=selected.name)
        else:
            products = products.filter(category__slug=category_slug)

    sort = request.query_params.get('sort', '').strip()
    sort_map = {
        'price-asc': 'price',
        'price-desc': '-price',
        'name-asc': 'name',
    }
    products = products.order_by(sort_map.get(sort, '-created_at'))

    paginator = ProductPagination()
    page = paginator.paginate_queryset(products, request)
    serializer = ProductSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
def get_product(request, pk):
    try:
        product = Product.objects.get(id=pk)
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error': 'Product Not Found'}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def create_product(request):
    serializer = ProductWriteSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save(created_by=request.user)
        for f in request.data.getlist('images'):
            ProductImage.objects.create(product=product, image=f)
        return Response(
            ProductSerializer(product, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=400)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def update_product(request, pk):
    try:
        product = Product.objects.get(id=pk, created_by=request.user)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found or not yours'}, status=404)

    serializer = ProductWriteSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        product = serializer.save()
        for f in request.data.getlist('images'):
            ProductImage.objects.create(product=product, image=f)
        return Response(ProductSerializer(product, context={'request': request}).data)
    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def delete_product(request, pk):
    try:
        product = Product.objects.get(id=pk, created_by=request.user)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found or not yours'}, status=404)
    product.delete()
    return Response({'message': 'Product deleted'}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def admin_products(request):
    """List only the products created by this admin."""
    products = Product.objects.filter(created_by=request.user)

    search = request.query_params.get('search', '').strip()
    if search:
        products = products.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )

    category_id = request.query_params.get('category', '').strip()
    if category_id:
        products = products.filter(category_id=category_id)

    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(["GET"])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    data = serializer.data
    seen = set()
    unique = []
    for cat in data:
        key = (cat.get('name') or '').lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(cat)
    return Response(unique)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def create_category(request):
    serializer = CategoryWriteSerializer(data=request.data)
    if serializer.is_valid():
        category = serializer.save(created_by=request.user)
        return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=400)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def update_category(request, pk):
    try:
        category = Category.objects.get(id=pk, created_by=request.user)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found or not yours'}, status=404)

    serializer = CategoryWriteSerializer(category, data=request.data)
    if serializer.is_valid():
        category = serializer.save()
        return Response(CategorySerializer(category).data)
    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def delete_category(request, pk):
    try:
        category = Category.objects.get(id=pk, created_by=request.user)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found or not yours'}, status=404)
    category.delete()
    return Response({'message': 'Category deleted'}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def admin_categories(request):
    """List only the categories created by this admin."""
    categories = Category.objects.filter(created_by=request.user)
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_cart(request):
    if not request.user.is_authenticated:
        return Response({'id': None, 'user': None, 'created_at': None, 'items': [], 'total': '0.00'})

    cart, _ = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(["POST"])
def add_to_cart(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Login required to add items to cart'}, status=401)

    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart, _ = Cart.objects.get_or_create(user=request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    if created:
        item.quantity = quantity
    else:
        item.quantity += quantity
    item.save()
    return Response({'message': 'Item added to cart', 'cart': CartSerializer(cart).data}, status=200)


@api_view(["PUT"])
def update_cart(request, pk):
    if not request.user.is_authenticated:
        return Response({'error': 'Login required to update cart'}, status=401)
    item_id = request.data.get('item_id')
    quantity = int(request.data.get('quantity', 1))
    CartItem.objects.filter(id=item_id).update(quantity=quantity)
    return Response({'message': 'Item updated in cart'}, status=200)


@api_view(["DELETE"])
def remove_from_cart(request, pk):
    item_id = request.data.get('item_id')
    CartItem.objects.filter(id=item_id).delete()
    return Response({'message': 'Item removed from cart'}, status=200)


def assign_timeline(order):
    """Snapshot the shipping/delivery ETA dates onto an order.

    Takes the worst-case (max) per-stage duration across all order items and
    computes the planned milestone dates from the order's creation date:
        shipping_eta         = created + shipping_days
        dispatch_eta         = shipping_eta + dispatch_days
        out_for_delivery_eta = dispatch_eta + out_for_delivery_days
        estimated_delivery   = out_for_delivery_eta   (final delivery date)

    Durations are copied onto the order at purchase time so later admin edits
    to a product's shipping days don't change the timeline of past orders.
    """
    items = order.items.select_related("product").all()
    if not items.exists():
        return

    shipping_days = max(it.product.shipping_days for it in items)
    dispatch_days = max(it.product.dispatch_days for it in items)
    ofd_days = max(it.product.out_for_delivery_days for it in items)

    base = order.created_at.date()
    order.shipping_eta = base + timedelta(days=shipping_days)
    order.dispatch_eta = order.shipping_eta + timedelta(days=dispatch_days)
    order.out_for_delivery_eta = order.dispatch_eta + timedelta(days=ofd_days)
    order.estimated_delivery = order.out_for_delivery_eta
    order.save(update_fields=[
        "shipping_eta", "dispatch_eta", "out_for_delivery_eta", "estimated_delivery",
    ])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    """
    Create an order from the authenticated user's cart.
    Expected body: { "address": "...", "phone": "..." } (optional overrides)
    Sets status to 'successful' by default (simulated payment).
    """
    user = request.user
    cart = Cart.objects.filter(user=user).first()
    if not cart:
        return Response({'error': 'Cart is empty'}, status=400)

    cart_items = cart.items.select_related('product').all()
    if not cart_items.exists():
        return Response({'error': 'Cart is empty'}, status=400)

    total = sum(item.product.price * item.quantity for item in cart_items)

    address = request.data.get('address', '').strip() or user.address
    phone = request.data.get('phone', '').strip() or user.phone

    updated = False
    if request.data.get('address', '').strip() and request.data.get('address').strip() != user.address:
        user.address = request.data.get('address').strip()
        updated = True
    if request.data.get('phone', '').strip() and request.data.get('phone').strip() != user.phone:
        user.phone = request.data.get('phone').strip()
        updated = True
    if updated:
        user.save()

    for _ in range(5):
        last_number = (
            Order.objects.filter(user=user).aggregate(
                max_number=Max('order_number')
            )['max_number']
        ) or 0
        try:
            with transaction.atomic():
                order = Order.objects.create(
                    user=user,
                    order_number=last_number + 1,
                    total_amount=total,
                    status='successful',
                )
            break
        except IntegrityError:
            continue
    else:
        return Response({'error': 'Could not create order, please try again.'}, status=500)

    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity,
            price=item.product.price,
        )

    cart_items.delete()

    assign_timeline(order)

    serializer = OrderDetailSerializer(order)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


def _is_razorpay_test_mode():
    """True when the configured key is a test key (rzp_test_*). Used only to
    surface a hint in API responses; it does not change the flow."""
    key_id = settings.RAZORPAY_KEY_ID or ""
    return key_id.startswith("rzp_test_")


def _razorpay_client():
    """Build a Razorpay client from the keys in settings/.env.

    Raises RuntimeError if the keys aren't configured, so the calling view can
    return a clean 500 instead of a confusing Razorpay auth failure.
    """
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    if not key_id or not key_secret:
        raise RuntimeError("Razorpay keys are not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).")
    return razorpay.Client(auth=(key_id, key_secret))


def _cart_grand_total(user):
    """Return (subtotal, shipping, grand_total) Decimals for the user's cart.

    Replicates the storefront free-shipping rule shown in Checkout.jsx:
    shipping is free once the subtotal reaches ₹50, otherwise ₹9.99.
    Returns (None, None, None) when the cart is empty.
    """
    cart = Cart.objects.filter(user=user).first()
    if not cart:
        return None, None, None
    cart_items = cart.items.select_related('product').all()
    if not cart_items.exists():
        return None, None, None

    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    subtotal = Decimal(subtotal).quantize(Decimal('0.01'))
    shipping = Decimal('0.00') if subtotal >= 50 else Decimal('9.99')
    grand_total = (subtotal + shipping).quantize(Decimal('0.01'))
    return subtotal, shipping, grand_total


def _allocate_order_number(user):
    """Allocate the next per-customer order_number with a retry loop for the
    unique-together constraint (mirrors the logic in checkout())."""
    for _ in range(5):
        last_number = (
            Order.objects.filter(user=user).aggregate(
                max_number=Max('order_number')
            )['max_number']
        ) or 0
        try:
            with transaction.atomic():
                order = Order.objects.create(
                    user=user,
                    order_number=last_number + 1,
                    total_amount=Decimal('0.00'),
                    status='pending',
                    payment_status='pending',
                )
            return order
        except IntegrityError:
            continue
    return None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout_razorpay(request):
    """Create a Razorpay order for the user's cart and return the details the
    frontend needs to open the Razorpay checkout modal.

    Body: { "address": "...", "phone": "..." } (optional overrides; saved to
    the user's profile like the regular checkout flow).

    The cart is NOT cleared here — that happens only after the payment is
    verified in checkout_razorpay_verify().
    """
    user = request.user

    subtotal, shipping, grand_total = _cart_grand_total(user)
    if grand_total is None:
        return Response({'error': 'Cart is empty'}, status=400)

    address = request.data.get('address', '').strip() or user.address
    phone = request.data.get('phone', '').strip() or user.phone
    updated = False
    if address and address != user.address:
        user.address = address
        updated = True
    if phone and phone != user.phone:
        user.phone = phone
        updated = True
    if updated:
        user.save()

    amount_paise = int((grand_total * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))

    try:
        client = _razorpay_client()
        rzp_order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"rcpt_{uuid.uuid4().hex[:30]}",
            "payment_capture": 1,
            "notes": {"django_user": user.username},
        })
    except RuntimeError as exc:
        return Response({'error': str(exc)}, status=500)
    except razorpay.errors.BadRequestError as exc:
        msg = str(exc)
        if "authentication failed" in msg.lower():
            logger.error(
                "Razorpay authentication failed — invalid/expired keys in .env "
                "(RAZORPAY_KEY_ID=%s). Regenerate the test key pair in the Razorpay "
                "dashboard and restart the server.",
                settings.RAZORPAY_KEY_ID,
            )
            return Response({
                'error': 'Razorpay keys are invalid or expired. Update RAZORPAY_KEY_ID and '
                         'RAZORPAY_KEY_SECRET in backend/.env with valid test keys from the '
                         'Razorpay dashboard, then restart the Django server.'
            }, status=500)
        return Response({'error': f'Razorpay rejected the order: {msg}'}, status=400)
    except Exception:
        logger.exception("Failed to create Razorpay order for user %s", user.username)
        return Response({'error': 'Could not initiate payment. Please try again.'}, status=500)

    order = _allocate_order_number(user)
    if order is None:
        return Response({'error': 'Could not create order, please try again.'}, status=500)

    cart_items = Cart.objects.get(user=user).items.select_related('product').all()
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity,
            price=item.product.price,
        )

    order.total_amount = grand_total
    order.razorpay_order_id = rzp_order['id']
    order.save(update_fields=['total_amount', 'razorpay_order_id'])

    return Response({
        'order_id': order.id,
        'razorpay_order_id': rzp_order['id'],
        'amount': amount_paise,
        'currency': 'INR',
        'key_id': settings.RAZORPAY_KEY_ID,
        'name': 'MyStore',
        'test_mode': _is_razorpay_test_mode(),
        'prefill': {
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'contact': phone or user.phone,
        },
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout_razorpay_verify(request):
    """Verify a Razorpay payment and finalize the order.

    Body: {
        "order_id": <django order id>,
        "razorpay_order_id": "...",
        "razorpay_payment_id": "...",
        "razorpay_signature": "..."
    }

    On success the order's payment_status is set to 'paid', the fulfillment
    status to 'confirmed', and the cart is cleared. Idempotent: re-verifying
    an already-paid order just returns it.
    """
    django_order_id = request.data.get('order_id')
    rzp_order_id = request.data.get('razorpay_order_id')
    rzp_payment_id = request.data.get('razorpay_payment_id')
    rzp_signature = request.data.get('razorpay_signature')

    if not all([django_order_id, rzp_order_id, rzp_payment_id, rzp_signature]):
        return Response({'error': 'Missing payment parameters.'}, status=400)

    try:
        order = Order.objects.get(id=django_order_id, user=request.user)
    except (Order.DoesNotExist, ValueError):
        return Response({'error': 'Order not found'}, status=404)

    if order.razorpay_order_id != rzp_order_id:
        return Response({'error': 'Order mismatch'}, status=400)

    if order.payment_status == 'paid' and order.payment_id:
        return Response(OrderDetailSerializer(order).data)

    try:
        client = _razorpay_client()
        client.utility.verify_payment_signature({
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_payment_id,
            "razorpay_signature": rzp_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        order.payment_status = 'failed'
        order.payment_id = rzp_payment_id
        order.save(update_fields=['payment_status', 'payment_id'])
        return Response({'error': 'Payment signature verification failed.'}, status=400)
    except RuntimeError as exc:
        return Response({'error': str(exc)}, status=500)
    except Exception:
        logger.exception("Razorpay signature verification failed for order %s", django_order_id)
        return Response({'error': 'Could not verify payment.'}, status=500)

    order.payment_status = 'paid'
    order.payment_id = rzp_payment_id
    order.status = 'confirmed'
    order.save(update_fields=['payment_status', 'payment_id', 'status'])

    assign_timeline(order)

    cart = Cart.objects.filter(user=request.user).first()
    if cart:
        cart.items.all().delete()

    return Response(OrderDetailSerializer(order).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_orders(request):
    """Return the authenticated customer's order history."""
    orders = (
        Order.objects.filter(user=request.user)
        .prefetch_related('items__product')
        .order_by('-created_at')
    )
    serializer = OrderListSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_order_detail(request, pk):
    """Return detail of one of the authenticated customer's orders."""
    try:
        order = Order.objects.select_related('user').prefetch_related('items__product').get(id=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    serializer = OrderDetailSerializer(order)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def get_orders(request):
    """List orders that contain products created by this admin."""
    orders = (
        Order.objects.filter(items__product__created_by=request.user)
        .select_related('user')
        .prefetch_related('items__product')
        .distinct()
        .order_by('-created_at')
    )

    search = request.query_params.get('search', '').strip()
    if search:
        orders = orders.filter(
            Q(user__username__icontains=search)
            | Q(user__email__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
        )

    serializer = OrderListSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def get_order_detail(request, pk):
    try:
        order = Order.objects.select_related('user').prefetch_related('items__product').get(id=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    if not order.items.filter(product__created_by=request.user).exists():
        return Response({'error': 'Order not found'}, status=404)

    serializer = OrderDetailSerializer(order)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def get_dashboard_stats(request):
    user = request.user
    total_products = Product.objects.filter(created_by=user).count()
    total_categories = Category.objects.filter(created_by=user).count()
    admin_orders = Order.objects.filter(items__product__created_by=user).distinct()
    total_orders = admin_orders.count()
    total_revenue = admin_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
    recent_orders = admin_orders.select_related('user').order_by('-created_at')[:5]

    data = {
        'total_products': total_products,
        'total_categories': total_categories,
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'recent_orders': OrderListSerializer(recent_orders, many=True).data,
    }
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_rating(request):
    """Create or update a rating for a product. User must have purchased the product."""
    serializer = RatingWriteSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        product = serializer.validated_data['product']
        score = serializer.validated_data['score']
        rating, created = Rating.objects.update_or_create(
            user=request.user,
            product=product,
            defaults={'score': score},
        )
        return Response(RatingSerializer(rating).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    return Response(serializer.errors, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_ratings(request):
    """Return all ratings by the authenticated user."""
    ratings = Rating.objects.filter(user=request.user).select_related('product')
    serializer = RatingSerializer(ratings, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def product_ratings(request, pk):
    """Public: return all ratings for a product."""
    try:
        product = Product.objects.get(id=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)
    ratings = Rating.objects.filter(product=product).select_related('user')
    serializer = RatingSerializer(ratings, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def admin_product_ratings(request):
    """Return all ratings for products created by this admin."""
    ratings = Rating.objects.filter(
        product__created_by=request.user
    ).select_related('user', 'product')
    serializer = RatingSerializer(ratings, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "Registration successful.", "user": UserProfileSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Return the authenticated user's profile including role."""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Let the authenticated user update their own details.

    Writable fields (per UserProfileSerializer): email, first_name,
    last_name, phone, address. username, role, id, is_staff stay read-only.
    """
    serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)