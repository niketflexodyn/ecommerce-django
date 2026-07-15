
# from unicodedata import category
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Product, Category, Cart, CartItem
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, CartItemSerializer  

@api_view(["GET"])
def get_products(request):
    products = Product.objects.all()
    search = request.query_params.get('search', '').strip()
    if search:
        products = products.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )
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

@api_view(["GET"])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data);

@api_view(["GET"])
def get_cart(request):
    cart = Cart.objects.get(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(["POST"])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)
    product = Product.objects.get(id=product_id)
    cart, created = Cart.objects.get_or_create(user=request.user)