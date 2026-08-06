import re
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import Category, Product, Cart, CartItem, Order, OrderItem, Rating, VariantAttribute, ProductVariant, Wishlist, User, Attribute, AttributeValue, ProductAttribute
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)
    
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'product_count', 'children', 'parent']

    def get_children(self, obj):
        children = obj.children.all()
        return CategorySerializer(children, many=True).data

class CategoryMenuSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "children"]

    def get_children(self, obj):
        return CategoryMenuSerializer(obj.children.all(), many=True).data
class CategoryWriteSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Category
        fields = ['name', 'slug', 'parent']

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

# serializers.py



class SubCategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent"]
        extra_kwargs = {
            "slug": {"required": False},
        }

    def validate_parent(self, value):
        if value.parent is not None:
            raise serializers.ValidationError(
                "Subcategories can only be created under parent categories."
            )
        return value

    def validate(self, attrs):
        if not attrs.get("slug"):
            base_slug = slugify(attrs["name"])
            slug = base_slug
            counter = 1

            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            attrs["slug"] = slug

        return attrs
class ProductAttributeSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source='attribute.name', read_only=True)
    value_name = serializers.CharField(source='value.value', read_only=True)

    class Meta:
        model = ProductAttribute
        fields = ['id', 'attribute', 'attribute_name', 'value', 'value_name']


class VariantAttributeSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source="attribute.name", read_only=True)
    value_name = serializers.CharField(source="value.value", read_only=True)

    class Meta:
        model = VariantAttribute
        fields = [
            "id",
            "attribute",
            "attribute_name",
            "value",
            "value_name",
        ]


class ProductVariantSerializer(serializers.ModelSerializer):
    attributes = VariantAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "sku",
            "price",
            "stock",
            "image",
            "is_active",
            "attributes",
        ]



class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')

        # Fallback to variant image or gallery image if base image is not present
        if not data.get("image"):
            variant_with_img = instance.variants.filter(is_active=True).exclude(image="").first()
            if variant_with_img and variant_with_img.image:
                data["image"] = (
                    request.build_absolute_uri(variant_with_img.image.url)
                    if request
                    else variant_with_img.image.url
                )
            elif instance.images.exists():
                first_gallery = instance.images.first()
                if first_gallery and first_gallery.image:
                    data["image"] = (
                        request.build_absolute_uri(first_gallery.image.url)
                        if request
                        else first_gallery.image.url
                    )

        # Fallback to first active variant's price if base price is zero or not set
        try:
            val = float(data.get("price") or 0)
        except (ValueError, TypeError):
            val = 0
        if val <= 0:
            first_variant = instance.variants.filter(is_active=True).first()
            if first_variant:
                data["price"] = str(first_variant.price)

        return data


class ProductWriteSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    image = serializers.ImageField(required=False, allow_null=True)

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

class AttributeValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeValue
        fields = [
            "id",
            "value",
        ]

class AttributeSerializer(serializers.ModelSerializer):
    values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = Attribute
        fields = [
            "id",
            "name",
            "values",
        ]


class AttributeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribute
        fields = ["id", "subcategory", "name"]

class AttributeValueWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeValue
        fields = ["id", "attribute", "value"]

class SubCategorySerializer(serializers.ModelSerializer):
    # Nest the full attribute + value objects so /api/subcategories/<slug>/attributes/
    # returns everything the storefront CategoryStrip needs in one request.
    attributes = AttributeSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "attributes"]
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

    def validate_first_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("First name is required.")
        if len(val) < 2 or len(val) > 50:
            raise serializers.ValidationError("First name must be between 2 and 50 characters.")
        if not re.match(r"^[a-zA-Z\s'-]+$", val):
            raise serializers.ValidationError("First name can only contain letters, spaces, and hyphens.")
        return val

    def validate_last_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Last name is required.")
        if len(val) < 2 or len(val) > 50:
            raise serializers.ValidationError("Last name must be between 2 and 50 characters.")
        if not re.match(r"^[a-zA-Z\s'-]+$", val):
            raise serializers.ValidationError("Last name can only contain letters, spaces, and hyphens.")
        return val

    def validate_username(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Username is required.")
        if len(val) < 3 or len(val) > 30:
            raise serializers.ValidationError("Username must be between 3 and 30 characters.")
        if not re.match(r"^[a-zA-Z0-9_]+$", val):
            raise serializers.ValidationError("Username can only contain letters, numbers, and underscores.")
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return val

    def validate_email(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Email is required.")
        if len(val) > 100:
            raise serializers.ValidationError("Email must not exceed 100 characters.")
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", val):
            raise serializers.ValidationError("Enter a valid email address.")
        if User.objects.filter(email__iexact=val).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return val

    def validate_phone(self, value):
        digits = re.sub(r"\D", "", value or "")
        if not digits:
            raise serializers.ValidationError("Phone number is required.")
        if len(digits) < 10 or len(digits) > 13:
            raise serializers.ValidationError("Phone number must be between 10 and 13 digits.")
        return digits

    def validate_address(self, value):
        val = (value or "").strip()
        if not val:
            raise serializers.ValidationError("Address is required.")
        if len(val) < 5 or len(val) > 500:
            raise serializers.ValidationError("Address must be between 5 and 500 characters.")
        if not re.search(r"[a-zA-Z0-9]", val):
            raise serializers.ValidationError("Please enter a valid street address.")
        return val

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

        # Admins must be approved by a super admin before they can log in.
        # Keep them inactive + pending until the super admin activates the account.
        if role == "admin":
            user.account_status = "pending"
            user.is_active = False

        user.save()

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for returning user profile info including role."""

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "role", "phone", "address", "location", "is_staff",
            "account_status",
        )
        read_only_fields = ("id", "username", "role", "is_staff", "account_status")

    def validate_first_name(self, value):
        val = (value or "").strip()
        if val:
            if len(val) < 2 or len(val) > 50:
                raise serializers.ValidationError("First name must be between 2 and 50 characters.")
            if not re.match(r"^[a-zA-Z\s'-]+$", val):
                raise serializers.ValidationError("First name can only contain letters, spaces, and hyphens.")
        return val

    def validate_last_name(self, value):
        val = (value or "").strip()
        if val:
            if len(val) < 2 or len(val) > 50:
                raise serializers.ValidationError("Last name must be between 2 and 50 characters.")
            if not re.match(r"^[a-zA-Z\s'-]+$", val):
                raise serializers.ValidationError("Last name can only contain letters, spaces, and hyphens.")
        return val

    def validate_email(self, value):
        val = (value or "").strip()
        if not val:
            raise serializers.ValidationError("Email is required.")
        if len(val) > 100:
            raise serializers.ValidationError("Email must not exceed 100 characters.")
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", val):
            raise serializers.ValidationError("Enter a valid email address.")
        user_qs = User.objects.filter(email__iexact=val)
        if self.instance:
            user_qs = user_qs.exclude(pk=self.instance.pk)
        if user_qs.exists():
            raise serializers.ValidationError("This email address is already in use.")
        return val

    def validate_phone(self, value):
        val = (value or "").strip()
        if val:
            digits = re.sub(r"\D", "", val)
            if len(digits) < 10 or len(digits) > 13:
                raise serializers.ValidationError("Phone number must be between 10 and 13 digits.")
            return digits
        return val

    def validate_address(self, value):
        val = (value or "").strip()
        if val:
            if len(val) < 5 or len(val) > 500:
                raise serializers.ValidationError("Address must be between 5 and 500 characters.")
            if not re.search(r"[a-zA-Z0-9]", val):
                raise serializers.ValidationError("Please enter a valid street address.")
        return val

    def validate_location(self, value):
        val = (value or "").strip()
        if val and len(val) > 200:
            raise serializers.ValidationError("Location must not exceed 200 characters.")
        return val


class AdminAccountSerializer(serializers.ModelSerializer):
    """Serializer used by super admins to review admin accounts.

    Exposes the approval lifecycle (account_status / is_active) alongside the
    registration details the super admin needs to decide whether to activate,
    reject, or suspend an admin.
    """

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "phone", "address", "location", "role", "is_staff",
            "is_active", "account_status", "date_joined",
        )
        read_only_fields = fields


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
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = Rating
        fields = ['id', 'user', 'product', 'score', 'created_at', 'updated_at', 'username', 'product_name', 'product_image']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            try:
                return obj.product.image.url
            except Exception:
                return None
        return None

# serializers.py

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product",
        write_only=True,
    )

    class Meta:
        model = Wishlist
        fields = [
            "id",
            "product",
            "product_id",
            "created_at",
        ]

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