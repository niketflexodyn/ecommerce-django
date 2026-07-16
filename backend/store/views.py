from decimal import Decimal
from django.db.models import Sum, Q
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Product, Category, Cart, CartItem, Order, OrderItem
from .permissions import IsAdminOrSuperAdmin
from .serializers import (
    ProductSerializer,
    CategorySerializer,
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
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken


class CustomTokenObtainPairView(TokenObtainPairView):
    """JWT login that returns user profile info alongside tokens."""
    serializer_class = CustomTokenObtainPairSerializer


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
        products = products.filter(category__slug=category_slug)

    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


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
    return Response(serializer.data)


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

    # Create order
    order = Order.objects.create(
        user=user,
        total_amount=total,
        status='successful',
    )

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