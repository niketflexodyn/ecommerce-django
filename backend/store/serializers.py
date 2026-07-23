from rest_framework import serializers
from .models import Category, Product, Cart, CartItem, Order, OrderItem, Rating, User
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'product_count']


class CategoryWriteSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Category
        fields = ['name', 'slug']

    def validate(self, attrs):
        if not attrs.get('slug'):
            base_slug = slugify(attrs.get('name', ''))
            if not base_slug:
                raise serializers.ValidationError({"name": "Name must not be empty"})
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exists():
                if self.instance and self.instance.slug == slug:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs['slug'] = slug
        return attrs


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    seller_name = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_average_rating(self, obj):
        ratings = obj.ratings.all()
        if not ratings.exists():
            return None
        return round(sum(r.score for r in ratings) / ratings.count(), 1)

    def get_rating_count(self, obj):
        return obj.ratings.count()

    def get_seller_name(self, obj):
        seller = obj.created_by
        if not seller:
            return None
        full = f"{seller.first_name} {seller.last_name}".strip()
        return full or seller.username

    def get_images(self, obj):
        return [img.image.url for img in obj.images.all()]


class ProductWriteSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    image = serializers.ImageField(required=True)

    class Meta:
        model = Product
        fields = [
            'category', 'name', 'description', 'price', 'location', 'image',
            'shipping_days', 'dispatch_days', 'out_for_delivery_days',
        ]


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = CartItem
        fields = '__all__'


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = '__all__'

    def get_total(self, obj):
        return obj.total


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=["customer", "admin"], default="customer")

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
            "role",
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
        role = validated_data.pop("role", "customer")

        user = User(**validated_data)
        user.set_password(password)
        user.role = role

        if role in ("admin", "super_admin"):
            user.is_staff = True

        user.save()

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for returning user profile info including role."""

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "role", "phone", "address", "location", "is_staff",
        )
        read_only_fields = ("id", "username", "role", "is_staff")


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user role and profile data in the response."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user).data
        return data


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'product_price']


class OrderListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'username', 'email', 'created_at', 'total_amount',
            'items_count', 'status',
            'estimated_delivery', 'shipping_eta', 'dispatch_eta', 'out_for_delivery_eta',
        ]

    def get_items_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    address = serializers.CharField(source='user.address', read_only=True)
    location = serializers.CharField(source='user.location', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'username', 'email', 'first_name', 'last_name',
            'phone', 'address', 'location', 'created_at', 'total_amount', 'items', 'status',
            'payment_status',
            'estimated_delivery', 'shipping_eta', 'dispatch_eta', 'out_for_delivery_eta',
            'dispatched_at', 'delivered_at',
        ]


class RatingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'product', 'score', 'created_at', 'updated_at', 'username', 'product_name']
        read_only_fields = ['user', 'created_at', 'updated_at']


class RatingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['product', 'score']

    def validate_score(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_product(self, product):
        user = self.context.get('request').user
        has_purchased = OrderItem.objects.filter(
            order__user=user,
            product=product,
            order__status='successful'
        ).exists()
        if not has_purchased:
            raise serializers.ValidationError("You can only rate products you have purchased.")
        return product


class DashboardStatsSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    recent_orders = OrderListSerializer(many=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs