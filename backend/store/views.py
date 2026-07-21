from decimal import Decimal
import logging
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


# -------------------------
# Password reset
# -------------------------

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
            # Don't leak the failure to the client (avoids user enumeration and
            # hides SMTP internals). Log it server-side so it can be debugged.
            logger.exception("Failed to send password-reset email to %s", email)

    # Same response whether or not the email exists — prevents user enumeration.
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
    user.save()  # token auto-invalidates: the password hash it was bound to has changed

    return Response({"message": "Password has been reset successfully."})


# -------------------------
# Products (Public)
# -------------------------

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
        # Match the selected category AND any siblings that share the same
        # name. Multiple admins can create categories with the same name
        # (different slugs); they should appear as one filter on the storefront
        # and surface all of their products together.
        selected = Category.objects.filter(slug=category_slug).first()
        if selected is not None:
            products = products.filter(category__name__iexact=selected.name)
        else:
            products = products.filter(category__slug=category_slug)

    # Server-side sort. Sorting must happen on the server now that the list is
    # paginated — otherwise each page would only be sorted within itself.
    sort = request.query_params.get('sort', '').strip()
    sort_map = {
        'price-asc': 'price',
        'price-desc': '-price',
        'name-asc': 'name',
    }
    products = products.order_by(sort_map.get(sort, '-created_at'))

    # Server-side pagination. Returns {count, next, previous, results} instead
    # of a bare array; page_size is overridable via ?page_size= (capped at 50).
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


# -------------------------
# Products (Admin)
# -------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def create_product(request):
    serializer = ProductWriteSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save(created_by=request.user)
        # Optional gallery images (the cover is saved above as product.image)
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
        # Append any new gallery images (cover is replaced only if a new image was sent)
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


# -------------------------
# Categories (Public)
# -------------------------

@api_view(["GET"])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    data = serializer.data
    # De-duplicate by name (case-insensitive). Multiple admins can each create
    # a "Fashion" category (with distinct slugs); the storefront filter should
    # list each name only once. Keep the first occurrence (lowest id).
    seen = set()
    unique = []
    for cat in data:
        key = (cat.get('name') or '').lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(cat)
    return Response(unique)


# -------------------------
# Categories (Admin)
# -------------------------

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


# -------------------------
# Cart
# -------------------------

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


# -------------------------
# Checkout (Customer)
# -------------------------

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

    # Compute total
    total = sum(item.product.price * item.quantity for item in cart_items)

    # Override address/phone if provided
    address = request.data.get('address', '').strip() or user.address
    phone = request.data.get('phone', '').strip() or user.phone

    # Update user profile if new info provided
    updated = False
    if request.data.get('address', '').strip() and request.data.get('address').strip() != user.address:
        user.address = request.data.get('address').strip()
        updated = True
    if request.data.get('phone', '').strip() and request.data.get('phone').strip() != user.phone:
        user.phone = request.data.get('phone').strip()
        updated = True
    if updated:
        user.save()

    # Create order — assign the next per-customer order_number (1, 2, 3, ...)
    # Retry on the off chance of a unique-together collision under concurrent checkouts.
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

    # Create order items
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity,
            price=item.product.price,
        )

    # Clear the cart
    cart_items.delete()

    serializer = OrderDetailSerializer(order)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# -------------------------
# Order History (Customer)
# -------------------------

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


# -------------------------
# Orders (Admin)
# -------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def get_orders(request):
    """List orders that contain products created by this admin."""
    # Only show orders that contain at least one product created by this admin
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
        # Only allow admin to see orders containing their products
        order = Order.objects.select_related('user').prefetch_related('items__product').get(id=pk)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    # Verify the admin has at least one product in this order
    if not order.items.filter(product__created_by=request.user).exists():
        return Response({'error': 'Order not found'}, status=404)

    serializer = OrderDetailSerializer(order)
    return Response(serializer.data)


# -------------------------
# Dashboard (Admin)
# -------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def get_dashboard_stats(request):
    user = request.user
    # Only count products/categories created by this admin
    total_products = Product.objects.filter(created_by=user).count()
    total_categories = Category.objects.filter(created_by=user).count()
    # Orders that contain this admin's products
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


# -------------------------
# Ratings (Customer)
# -------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_rating(request):
    """Create or update a rating for a product. User must have purchased the product."""
    serializer = RatingWriteSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        product = serializer.validated_data['product']
        score = serializer.validated_data['score']
        # Upsert: create or update the rating
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


# -------------------------
# Ratings (Admin — scoped to their products)
# -------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def admin_product_ratings(request):
    """Return all ratings for products created by this admin."""
    ratings = Rating.objects.filter(
        product__created_by=request.user
    ).select_related('user', 'product')
    serializer = RatingSerializer(ratings, many=True)
    return Response(serializer.data)


# -------------------------
# Auth
# -------------------------

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