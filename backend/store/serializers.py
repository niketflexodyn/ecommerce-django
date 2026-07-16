from rest_framework import serializers
from .models import Category, Product, Cart, CartItem, User
from django.contrib.auth.password_validation import validate_password

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image',read_only=True)

    class Meta:
        model = CartItem
        fields = '__all__'



class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:

        model = User

        fields = (
            "first_name",
            "last_name",
            "username",
            "email",
            "phone",
            "address",
            "password",
            "confirm_password",
        )

    def validate(self, attrs):

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"password": "Passwords don't match"}
            )

        validate_password(attrs["password"])

        return attrs

    def create(self, validated_data):

        validated_data.pop("confirm_password")

        password = validated_data.pop("password")

        user = User(**validated_data)

        user.set_password(password)

        user.role = "customer"

        user.save()

        return user

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = '__all__'

    def get_total(self, obj):
        return obj.total