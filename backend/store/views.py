# from backend.store.serializers import WishlistSerializer

from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
import json
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
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.views import APIView

User = get_user_model()

logger = logging.getLogger("store")

# pyrefly: ignore [missing-import]
from .models import Product, Category,VendorSubscription, VendorSubscriptionPlan, Wishlist, Cart, CartItem, Order, OrderItem, Rating, ProductImage, Attribute, AttributeValue, ProductAttribute, ProductVariant, VariantAttribute, Discount
# pyrefly: ignore [missing-import]
from .pagination import ProductPagination, AdminProductPagination, CategoryPagination, OrderPagination, AdminAccountPagination
# pyrefly: ignore [missing-import]
from .permissions import IsAdminOrSuperAdmin, IsSuperAdmin
# pyrefly: ignore [missing-import]
from .serializers import (
    SubCategorySerializer,
    ProductSerializer,
    CategorySerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    CategoryWriteSerializer,
    ProductWriteSerializer,
    VendorSubscriptionPlanSerializer,
    CartSerializer,
    SubCategoryCreateSerializer,
    CartItemSerializer,
    RegisterSerializer,
    VendorSubscriptionSerializer,
    UserProfileSerializer,
    ProductVariantSerializer,
    CustomTokenObtainPairSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
    DashboardStatsSerializer,
    RatingSerializer,
    RatingWriteSerializer,
    AdminAccountSerializer,
    AttributeWriteSerializer,
    AttributeValueWriteSerializer,
    AttributeSerializer,
    AttributeValueSerializer,
    WishlistSerializer,
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

@api_view(["GET"])
def get_subcategory_attributes(request, slug):
    subcategory = get_object_or_404(
        Category,
        slug=slug,
        parent__isnull=False
    )

    serializer = SubCategorySerializer(subcategory)

    return Response(serializer.data)

# views.py

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_to_wishlist(request):
    product_id = request.data.get("product_id")

    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    wishlist_item, created = Wishlist.objects.get_or_create(
        user=request.user,
        product=product,
    )

    if not created:
        return Response(
            {"message": "Already in wishlist"},
            status=status.HTTP_200_OK,
        )

    return Response(
        WishlistSerializer(wishlist_item).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def get_product_variants(request, pk):
    """
    Get all active variants for a specific product.
    """
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    variants = product.variants.filter(is_active=True)
    serializer = ProductVariantSerializer(variants, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["GET"])
def find_product_variant(request, pk):
    """
    Find the matching variant based on selected attribute values.

    Example:
    GET /api/products/26/find-variant/?values=18,20
    """

    values = request.GET.get("values")

    if not values:
        return Response(
            {"error": "No attribute values selected."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        value_ids = [int(v) for v in values.split(",")]
    except ValueError:
        return Response(
            {"error": "Invalid value ids."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    variants = product.variants.filter(is_active=True)

    print("Selected Value IDs:", value_ids)

    for variant in variants:
        variant_value_ids = list(
        variant.attributes.values_list("value_id", flat=True)
    )

    print("SKU:", variant.sku)
    print("Variant Values:", variant_value_ids)

    if sorted(variant_value_ids) == sorted(value_ids):
        serializer = ProductVariantSerializer(
            variant,
            context={"request": request},
        )
        return Response(serializer.data)

    return Response(
    {"error": "Variant not found."},
    status=status.HTTP_404_NOT_FOUND,
    )

@api_view(["GET"])
def get_subscription_plans(request):
    """
    Get all vendor subscription plans.
    Returns only active plans for regular users/vendors, and all plans for super_admins.
    """
    if request.user and request.user.is_authenticated and getattr(request.user, "role", None) == "super_admin":
        plans = VendorSubscriptionPlan.objects.all()
    else:
        plans = VendorSubscriptionPlan.objects.filter(is_active=True)

    serializer = VendorSubscriptionPlanSerializer(
        plans,
        many=True
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_my_subscription(request):
    """
    Get the logged-in vendor's current subscription.
    """

    subscription = (
        VendorSubscription.objects
        .filter(vendor=request.user)
        .order_by("-created_at")
        .first()
    )

    if not subscription:
        return Response(
            {
                "message": "No subscription found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = VendorSubscriptionSerializer(
        subscription
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_subscription_payment(request):
    """
    Verify Razorpay subscription payment and activate
    the vendor subscription.
    """

    razorpay_payment_id = request.data.get("razorpay_payment_id")
    razorpay_subscription_id = request.data.get(
        "razorpay_subscription_id"
    )
    razorpay_signature = request.data.get(
        "razorpay_signature"
    )

    if not razorpay_payment_id:
        return Response(
            {"error": "Razorpay payment ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not razorpay_subscription_id:
        return Response(
            {"error": "Razorpay subscription ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not razorpay_signature:
        return Response(
            {"error": "Razorpay signature is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        subscription = VendorSubscription.objects.get(
            vendor=request.user,
            razorpay_subscription_id=razorpay_subscription_id,
        )

    except VendorSubscription.DoesNotExist:
        return Response(
            {"error": "Subscription not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Razorpay client
    client = razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET,
        )
    )

    try:
        client.utility.verify_subscription_payment_signature({
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_subscription_id": razorpay_subscription_id,
            "razorpay_signature": razorpay_signature,
        })

    except razorpay.errors.SignatureVerificationError:
        return Response(
            {"error": "Payment verification failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Payment is verified
    subscription.status = "active"
    subscription.start_date = timezone.now()

    # Set end date based on plan duration
    subscription.end_date = (
        subscription.start_date +
        timedelta(days=subscription.plan.duration_days)
    )

    subscription.save()

    return Response(
        {
            "message": "Subscription activated successfully.",
            "subscription": VendorSubscriptionSerializer(
                subscription
            ).data,
        },
        status=status.HTTP_200_OK,
    )





class CurrentSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sub = VendorSubscription.objects.filter(vendor=request.user, status="active").first()
        if not sub:
            return Response(None)
        return Response({"plan_id": sub.plan_id, "status": sub.status, "end_date": sub.end_date})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_vendor_subscription(request):

    plan_id = request.data.get("plan")
    billing_cycle = request.data.get("billing_cycle", "monthly")

    if not plan_id:
        return Response(
            {"error": "Plan is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        plan = VendorSubscriptionPlan.objects.get(
            id=plan_id,
            is_active=True
        )
    except VendorSubscriptionPlan.DoesNotExist:
        return Response(
            {"error": "Subscription plan not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    price = plan.annual_price if billing_cycle == "annual" else plan.monthly_price
    razorpay_plan_id = plan.razorpay_annual_plan_id if billing_cycle == "annual" else plan.razorpay_monthly_plan_id

    if price == 0:
        subscription = VendorSubscription.objects.create(
            vendor=request.user,
            plan=plan,
            status="active",
            billing_cycle=billing_cycle,
        )
        serializer = VendorSubscriptionSerializer(subscription)
        return Response(
            {
                "subscription": serializer.data,
                "status": "active"
            },
            status=status.HTTP_201_CREATED
        )

    if not razorpay_plan_id:
        return Response(
            {
                "error": "This plan is not configured with Razorpay."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    active_subscription = VendorSubscription.objects.filter(
        vendor=request.user,
        status="active"
    ).first()

    if active_subscription:
        return Response(
            {
                "error": "You already have an active subscription."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    client = razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET,
        )
    )

    razorpay_subscription = client.subscription.create({
        "plan_id": razorpay_plan_id,
        "total_count": 12 if billing_cycle == "monthly" else 1,
    })

    subscription = VendorSubscription.objects.create(
        vendor=request.user,
        plan=plan,
        status="pending",
        razorpay_subscription_id=razorpay_subscription["id"],
        billing_cycle=billing_cycle,
    )

    serializer = VendorSubscriptionSerializer(subscription)

    return Response(
        {
            "subscription": serializer.data,
            "razorpay_subscription_id": razorpay_subscription["id"],
            "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        },
        status=status.HTTP_201_CREATED
    )
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_product_variant(request, pk):
    """
    Create a new variant for a product (Admin only).
    """
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = ProductVariantSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        variant = serializer.save(product=product)
        
        # Save custom attributes selected for this variant
        attributes_data = request.data.get('attributes')
        if attributes_data:
            try:
                attrs_dict = json.loads(attributes_data) if isinstance(attributes_data, str) else attributes_data
                if isinstance(attrs_dict, dict):
                    for attr_id, val_id in attrs_dict.items():
                        if attr_id and val_id:
                            VariantAttribute.objects.create(
                                variant=variant,
                                attribute_id=attr_id,
                                value_id=val_id,
                            )
            except Exception as e:
                logger.exception("Error saving variant attributes: %s", e)
        
        # Handle discount for new variant
        discount_val = request.data.get('discount')
        discount_type = request.data.get('discount_type', 'percentage') or 'percentage'
        if discount_val not in (None, '', 'null'):
            try:
                val = Decimal(str(discount_val).strip())
                if val > Decimal('0'):
                    Discount.objects.create(
                        variant=variant,
                        discount_type=discount_type,
                        value=val,
                        is_active=True,
                    )
            except Exception as e:
                logger.exception("Error saving variant discount: %s", e)

        return Response(ProductVariantSerializer(variant, context={"request": request}).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def create_subscription_plan(request):

    serializer = VendorSubscriptionPlanSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    plan = serializer.save()

    if plan.monthly_price > 0:
        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )
        razorpay_plan = client.plan.create({
            "period": "monthly",
            "interval": 1,
            "item": {
                "name": f"{plan.name} - Monthly",
                "amount": int(plan.monthly_price * 100),
                "currency": "INR",
                "description": plan.description or plan.name,
            }
        })
        plan.razorpay_monthly_plan_id = razorpay_plan["id"]

    if plan.annual_price > 0:
        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET,
            )
        )
        razorpay_plan = client.plan.create({
            "period": "yearly",
            "interval": 1,
            "item": {
                "name": f"{plan.name} - Annual",
                "amount": int(plan.annual_price * 100),
                "currency": "INR",
                "description": plan.description or plan.name,
            }
        })
        plan.razorpay_annual_plan_id = razorpay_plan["id"]

    if plan.monthly_price > 0 or plan.annual_price > 0:
        plan.save(update_fields=["razorpay_monthly_plan_id", "razorpay_annual_plan_id"])

    return Response(
        VendorSubscriptionPlanSerializer(plan).data,
        status=status.HTTP_201_CREATED
    )
@api_view(["GET"])
def list_subscription_plans(request):
    plans = VendorSubscriptionPlan.objects.all()
    serializer = VendorSubscriptionPlanSerializer(plans, many=True)
    return Response(serializer.data)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def update_subscription_plan(request, pk):
    try:
        plan = VendorSubscriptionPlan.objects.get(pk=pk)
    except VendorSubscriptionPlan.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
        
    serializer = VendorSubscriptionPlanSerializer(plan, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def delete_subscription_plan(request, pk):
    try:
        plan = VendorSubscriptionPlan.objects.get(pk=pk)
        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except VendorSubscriptionPlan.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_subscription(request, pk):
    try:
        subscription = VendorSubscription.objects.get(pk=pk, vendor=request.user)
    except VendorSubscription.DoesNotExist:
        return Response(
            {"error": "Subscription not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    client = razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET,
        )
    )

    try:
        client.subscription.cancel(subscription.razorpay_subscription_id)
        subscription.status = "cancelled"
        subscription.save()
    except Exception as e:
        logger.exception("Error cancelling subscription: %s", e)
        return Response(
            {"error": "Failed to cancel subscription"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"message": "Subscription cancelled successfully"})

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_product_variant(request, pk):
    """
    Update an existing variant (Admin only).
    """
    try:
        variant = ProductVariant.objects.get(pk=pk)
    except ProductVariant.DoesNotExist:
        return Response(
            {"error": "Variant not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    partial = request.method == "PUT"
    serializer = ProductVariantSerializer(variant, data=request.data, partial=True, context={"request": request})
    if serializer.is_valid():
        variant = serializer.save()
        
        # Update custom attributes for this variant
        attributes_data = request.data.get('attributes')
        if attributes_data:
            try:
                attrs_dict = json.loads(attributes_data) if isinstance(attributes_data, str) else attributes_data
                if isinstance(attrs_dict, dict):
                    VariantAttribute.objects.filter(variant=variant).delete()
                    for attr_id, val_id in attrs_dict.items():
                        if attr_id and val_id:
                            VariantAttribute.objects.create(
                                variant=variant,
                                attribute_id=attr_id,
                                value_id=val_id,
                            )
            except Exception as e:
                logger.exception("Error saving variant attributes: %s", e)

        # Handle discount for existing variant
        discount_val = request.data.get('discount')
        discount_type = request.data.get('discount_type', 'percentage') or 'percentage'
        if discount_val not in (None, '', 'null'):
            try:
                val = Decimal(str(discount_val).strip())
                if val > Decimal('0'):
                    disc = variant.discounts.filter(is_active=True).first()
                    if disc:
                        disc.discount_type = discount_type
                        disc.value = val
                        disc.save()
                    else:
                        Discount.objects.create(
                            variant=variant,
                            discount_type=discount_type,
                            value=val,
                            is_active=True,
                        )
                else:
                    variant.discounts.filter(is_active=True).update(is_active=False)
            except Exception as e:
                logger.exception("Error updating variant discount: %s", e)
        elif 'discount' in request.data:
            # Explicitly cleared discount
            variant.discounts.filter(is_active=True).update(is_active=False)

        return Response(ProductVariantSerializer(variant, context={"request": request}).data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def delete_product_variant(request, pk):
    """
    Delete a variant (Admin only).
    """
    try:
        variant = ProductVariant.objects.get(pk=pk)
    except ProductVariant.DoesNotExist:
        return Response(
            {"error": "Variant not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    variant.delete()
    return Response({"message": "Variant deleted successfully"}, status=status.HTTP_200_OK)



@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def update_subcategory(request, pk):
    try:
        subcategory = Category.objects.get(pk=pk, parent__isnull=False)
    except Category.DoesNotExist:
        return Response(
            {"error": "Subcategory not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = SubCategoryCreateSerializer(
        subcategory,
        data=request.data,
        partial=True,
    )

    if serializer.is_valid():
        serializer.save()
        return Response(CategorySerializer(subcategory).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_wishlist(request):
    wishlist = Wishlist.objects.filter(user=request.user)

    serializer = WishlistSerializer(
        wishlist,
        many=True,
    )

    return Response(serializer.data)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_from_wishlist(request, product_id):
    try:
        wishlist = Wishlist.objects.get(
            user=request.user,
            product_id=product_id,
        )
    except Wishlist.DoesNotExist:
        return Response(
            {"error": "Item not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    wishlist.delete()

    return Response(
        {"message": "Removed from wishlist"},
        status=status.HTTP_200_OK,
    )
    
@api_view(["GET"])
def get_subcategories(request, category_id):
    subcategories = Category.objects.filter(parent_id=category_id)
    serializer = CategorySerializer(subcategories, many=True)
    return Response(serializer.data)
# views.py

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def create_subcategory(request, category_id):
    try:
        parent = Category.objects.get(id=category_id, parent__isnull=True)
    except Category.DoesNotExist:
        return Response(
            {"error": "Category not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data.copy()
    data["parent"] = parent.id

    serializer = SubCategoryCreateSerializer(data=data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def delete_subcategory(request, pk):
    try:
        subcategory = Category.objects.get(pk=pk, parent__isnull=False)
    except Category.DoesNotExist:
        return Response(
            {"error": "Subcategory not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    subcategory.delete()

    return Response(
        {"message": "Subcategory deleted successfully"},
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
        selected = Category.objects.filter(slug__iexact=category_slug).first()
        if selected is not None:
            # Include the selected category and all of its descendant
            # subcategories, so products assigned to a subcategory still show
            # up when their parent category is selected.
            descendant_ids = list(selected.children.values_list('id', flat=True))
            descendant_ids.append(selected.id)
            products = products.filter(category_id__in=descendant_ids)
        else:
            products = products.filter(category__slug__iexact=category_slug)

    # Subcategory drill-down: match the product's category (a child Category)
    # by slug or name, case-insensitively.
    subcategory = request.query_params.get('subcategory', '').strip()
    if subcategory:
        sub = Category.objects.filter(
            Q(slug__iexact=subcategory) | Q(name__iexact=subcategory)
        ).first()
        if sub is not None:
            products = products.filter(category_id=sub.id)
        else:
            products = products.filter(category__name__iexact=subcategory)
    
    min_price = request.query_params.get("min_price")
    max_price = request.query_params.get("max_price")

    if min_price or max_price:

        variant_filter = Q()

        if min_price:
            variant_filter &= Q(variants__price__gte=min_price)

        if max_price:
            variant_filter &= Q(variants__price__lte=max_price)

        products = products.filter(
            Q(
                variants__isnull=True,
                **(
                {"price__gte": min_price}
                if min_price else {}
                ),
                **(
                    {"price__lte": max_price}
                    if max_price else {}
                ),
        )
        | variant_filter
    ).distinct()
    # Attribute drill-down: any query param starting with "attr_" is treated as
    # attributes__<name>=<value>. The relational model stores attributes as
    # ProductAttribute rows (attribute.name + value.value), so both conditions
    # are applied in a single filter() to pin the same row. Each attribute is a
    # separate filter() call so distinct attributes AND across separate joins.
    for key, value in request.query_params.items():
        if key.startswith("attr_") and value.strip():

            attribute_name = key[5:]
            attribute_value = value.strip()

            products = products.filter( 
                Q(
                    attributes__attribute__name__iexact=attribute_name,
                    attributes__value__value__iexact=attribute_value,
                )
                |Q(
                    variants__attributes__attribute__name__iexact=attribute_name,
                    variants__attributes__value__value__iexact=attribute_value,
                )
            ).distinct()

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
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_product(request):
    if not request.user.is_superuser:
        active_sub = VendorSubscription.objects.filter(vendor=request.user, status="active").first()
        if not active_sub:
            return Response(
                {"error": "You must have an active subscription to add products."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if active_sub.plan.product_limit is not None:
            current_count = Product.objects.filter(created_by=request.user).count()
            if current_count >= active_sub.plan.product_limit:
                return Response(
                    {"error": f"You have reached your plan's limit of {active_sub.plan.product_limit} products. Please upgrade your subscription."},
                    status=status.HTTP_403_FORBIDDEN
                )

    serializer = ProductWriteSerializer(data=request.data)
    if serializer.is_valid():
        with transaction.atomic():
            product = serializer.save(created_by=request.user)
            for f in request.data.getlist('images'):
                if f:
                    ProductImage.objects.create(product=product, image=f)
                
            attributes_data = request.data.get('attributes')
            if attributes_data:
                import json
                try:
                    attrs_dict = json.loads(attributes_data)
                    if isinstance(attrs_dict, dict):
                        for attr_id, val_id in attrs_dict.items():
                            if val_id and attr_id:
                                ProductAttribute.objects.update_or_create(
                                    product=product,
                                    attribute_id=attr_id,
                                    defaults={'value_id': val_id}
                                )
                except Exception as e:
                    print("Error saving attributes:", e)
                    
        return Response(
            ProductSerializer(product, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=400)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_product(request, pk):
    try:
        product = Product.objects.get(id=pk, created_by=request.user)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found or not yours'}, status=404)

    if request.data.get('remove_image') in ['true', 'True', True, '1']:
        if product.image and not request.FILES.get('image'):
            product.image.delete(save=False)
            product.image = None
            product.save(update_fields=['image'])

    serializer = ProductWriteSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        with transaction.atomic():
            product = serializer.save()
            for f in request.data.getlist('images'):
                if f:
                    ProductImage.objects.create(product=product, image=f)
                
            attributes_data = request.data.get('attributes')
            if attributes_data:
                import json
                try:
                    attrs_dict = json.loads(attributes_data)
                    if isinstance(attrs_dict, dict):
                        ProductAttribute.objects.filter(product=product).delete()
                        for attr_id, val_id in attrs_dict.items():
                            if val_id and attr_id:
                                ProductAttribute.objects.update_or_create(
                                    product=product,
                                    attribute_id=attr_id,
                                    defaults={'value_id': val_id}
                                )
                except Exception:
                    pass
                    
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
    """List products created by this admin (or all for superadmin)."""
    if getattr(request.user, 'role', '') == 'superadmin' or request.user.is_superuser:
        products = Product.objects.all()
    else:
        products = Product.objects.filter(created_by=request.user)

    search = request.query_params.get('search', '').strip()
    if search:
        products = products.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )

    category_id = request.query_params.get('category', '').strip()
    if category_id:
        products = products.filter(category_id=category_id)
    products = products.order_by('-created_at')

    if request.query_params.get('all') == 'true':
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    paginator = AdminProductPagination()    
    page = paginator.paginate_queryset(products, request)
    serializer = ProductSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
def get_categories(request):
    categories = Category.objects.filter(parent__isnull=True)
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
        category = serializer.save()
        return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=400)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def update_category(request, pk):
    try:
        category = Category.objects.get(id=pk)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)

    serializer = CategoryWriteSerializer(category, data=request.data)
    if serializer.is_valid():
        category = serializer.save()
        return Response(CategorySerializer(category).data)
    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def delete_category(request, pk):
    try:
        category = Category.objects.get(id=pk)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
    category.delete()
    return Response({'message': 'Category deleted'}, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def admin_categories(request):
    """List all categories with server-side search and pagination."""
    categories = Category.objects.all()

    search = request.query_params.get('search', '').strip()
    if search:
        categories = categories.filter(
            Q(name__icontains=search) | Q(slug__icontains=search)
        )

    categories = categories.order_by('-id')

    # If 'all=true' is requested (e.g. for product form dropdowns), return unpaginated list
    if request.query_params.get('all') == 'true':
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    paginator = CategoryPagination()
    page = paginator.paginate_queryset(categories, request)
    serializer = CategorySerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)



@api_view(["GET"])
def get_cart(request):
    if not request.user.is_authenticated:
        return Response({'id': None, 'user': None, 'created_at': None, 'items': [], 'total': '0.00'})

    cart, _ = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data)


@api_view(["POST"])
def add_to_cart(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Login required to add items to cart'}, status=401)

    product_id = request.data.get('product_id')
    variant_id = request.data.get('variant_id')
    quantity = int(request.data.get('quantity', 1))

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    variant = None
    if variant_id:
        try:
            variant = ProductVariant.objects.get(id=variant_id, product=product)
        except ProductVariant.DoesNotExist:
            variant = None

    cart, _ = Cart.objects.get_or_create(user=request.user)
    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        variant=variant,
    )
    if created:
        item.quantity = quantity
    else:
        item.quantity += quantity
    item.save()
    return Response({'message': 'Item added to cart', 'cart': CartSerializer(cart, context={'request': request}).data}, status=200)


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

    cart_items = cart.items.select_related('product', 'variant').all()
    if not cart_items.exists():
        return Response({'error': 'Cart is empty'}, status=400)

    total = sum(item.subtotal for item in cart_items)

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
                    shipping_address=address,
                    shipping_phone=phone,
                    shipping_location=user.location,
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
            variant=item.variant,
            quantity=item.quantity,
            price=item.unit_price,
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
    cart_items = cart.items.select_related('product', 'variant').all()
    if not cart_items.exists():
        return None, None, None

    subtotal = sum(item.subtotal for item in cart_items)
    subtotal = Decimal(subtotal).quantize(Decimal('0.01'))
    shipping = Decimal('0.00') if subtotal >= 50 else Decimal('9.99')
    grand_total = (subtotal + shipping).quantize(Decimal('0.01'))
    return subtotal, shipping, grand_total


def _allocate_order_number(user, shipping_address=None, shipping_phone=None, shipping_location=None):
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
                    shipping_address=shipping_address,
                    shipping_phone=shipping_phone,
                    shipping_location=shipping_location,
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

    order = _allocate_order_number(user, shipping_address=address, shipping_phone=phone, shipping_location=user.location)
    if order is None:
        return Response({'error': 'Could not create order, please try again.'}, status=500)

    cart_items = Cart.objects.get(user=user).items.select_related('product', 'variant').all()
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            variant=item.variant,
            quantity=item.quantity,
            price=item.unit_price,
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
    """Return the authenticated customer's order history with server-side pagination."""
    orders = (
        Order.objects.filter(user=request.user)
        .prefetch_related('items__product')
        .order_by('-created_at')
    )

    if request.query_params.get('all') == 'true':
        serializer = OrderListSerializer(orders, many=True)
        return Response(serializer.data)

    paginator = OrderPagination()
    page = paginator.paginate_queryset(orders, request)
    serializer = OrderListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


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
    """List orders with server-side search and pagination (scoped to admin's products or all if superadmin)."""
    if getattr(request.user, 'role', '') == 'superadmin' or request.user.is_superuser:
        orders = Order.objects.all()
    else:
        orders = Order.objects.filter(items__product__created_by=request.user)

    orders = (
        orders.select_related('user')
        .prefetch_related('items__product')
        .distinct()
        .order_by('-created_at')
    )

    search = request.query_params.get('search', '').strip()
    if search:
        search_filter = (
            Q(user__username__icontains=search)
            | Q(user__email__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
            | Q(order_number__icontains=search)
        )
        if search.isdigit():
            search_filter |= Q(id=int(search))
        orders = orders.filter(search_filter)

    if request.query_params.get('all') == 'true':
        serializer = OrderListSerializer(orders, many=True)
        return Response(serializer.data)

    paginator = OrderPagination()
    page = paginator.paginate_queryset(orders, request)
    serializer = OrderListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def admin_orders(request):
    """Alias for get_orders with server-side search and pagination."""
    return get_orders(request)

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
    total_categories = Category.objects.count()
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
    """Return all ratings for products created by this admin (or all for superadmin), optionally filtered by product."""
    if getattr(request.user, 'role', '') == 'superadmin' or request.user.is_superuser:
        ratings = Rating.objects.all()
    else:
        ratings = Rating.objects.filter(product__created_by=request.user)

    product_id = request.query_params.get('product') or request.query_params.get('product_id')
    if product_id:
        ratings = ratings.filter(product_id=product_id)

    ratings = ratings.select_related('user', 'product').order_by('-created_at')
    serializer = RatingSerializer(ratings, many=True)
    return Response(serializer.data)


def _notify_superadmins_of_registration(admin_user):
    """Best-effort: email every super admin that a new admin is awaiting approval.

    Failures are logged but never bubble up — registration must succeed even if
    the notification can't be sent (mirrors the password-reset email behaviour).
    """
    superadmins = User.objects.filter(is_superuser=True)
    emails = [u.email for u in superadmins if u.email]
    if not emails:
        return

    full_name = f"{admin_user.first_name} {admin_user.last_name}".strip() or admin_user.username
    try:
        send_mail(
            subject="New admin registration pending approval",
            message=(
                "A new admin has registered and is awaiting your approval.\n\n"
                f"Name: {full_name}\n"
                f"Username: {admin_user.username}\n"
                f"Email: {admin_user.email}\n"
                f"Phone: {admin_user.phone or '-'}\n"
                f"Address: {admin_user.address or '-'}\n\n"
                "Log in to the admin panel to activate, reject, or suspend the account."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=emails,
            fail_silently=True,
        )
    except Exception:
        logger.exception(
            "Failed to notify super admins of new admin registration (%s)",
            admin_user.username,
        )


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Admins are created as 'pending' — flag the registration so the
        # frontend can show the awaiting-approval state, and let the super
        # admins know there is a new account to review.
        if user.role == "admin":
            _notify_superadmins_of_registration(user)
            return Response(
                {
                    "message": "Registration successful. Your account is pending approval by a super admin.",
                    "user": UserProfileSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {"message": "Registration successful.", "user": UserProfileSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=400)


# ---------------------------------------------------------------------------
# Super admin → admin account approval workflow
# ---------------------------------------------------------------------------

def _set_admin_account_status(admin_user, new_status, make_active):
    """Apply an approval decision to an admin account and persist it.

    `make_active` controls is_active so the user can/cannot log in:
        activate  -> active,  is_active=True
        reject    -> rejected, is_active=False
        suspend   -> suspended, is_active=False
    """
    admin_user.account_status = new_status
    admin_user.is_active = make_active
    admin_user.save(update_fields=["account_status", "is_active"])


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def superadmin_admins(request):
    """List admin accounts for super admin review.

    Optional `?status=pending|active|rejected|suspended` filter and `?search=...`.
    Supports server-side pagination with `?page=X&page_size=Y`.
    """
    qs = User.objects.filter(role="admin").order_by("-date_joined")

    status_filter = request.query_params.get("status", "").strip()
    if status_filter:
        qs = qs.filter(account_status=status_filter)

    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(
            Q(username__icontains=search)
            | Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(phone__icontains=search)
        )

    # Status counts for header tabs
    all_admins = User.objects.filter(role="admin")
    counts = {
        "all": all_admins.count(),
        "pending": all_admins.filter(account_status="pending").count(),
        "active": all_admins.filter(account_status="active").count(),
        "suspended": all_admins.filter(account_status="suspended").count(),
        "rejected": all_admins.filter(account_status="rejected").count(),
    }

    if request.query_params.get("all") == "true":
        serializer = AdminAccountSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count(), "counts": counts})

    paginator = AdminAccountPagination()
    page = paginator.paginate_queryset(qs, request)
    serializer = AdminAccountSerializer(page, many=True)
    response = paginator.get_paginated_response(serializer.data)
    response.data["counts"] = counts
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def superadmin_pending_admins(request):
    """Convenience list of admins awaiting approval (account_status=pending)."""
    qs = User.objects.filter(role="admin", account_status="pending").order_by("-date_joined")
    serializer = AdminAccountSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def superadmin_activate_admin(request, pk):
    """Activate a pending/rejected/suspended admin so they can log in."""
    try:
        admin_user = User.objects.get(pk=pk, role="admin")
    except User.DoesNotExist:
        return Response({"error": "Admin not found"}, status=404)
    _set_admin_account_status(admin_user, "active", True)
    return Response(AdminAccountSerializer(admin_user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def superadmin_reject_admin(request, pk):
    """Reject an admin's registration; the account stays inactive."""
    try:
        admin_user = User.objects.get(pk=pk, role="admin")
    except User.DoesNotExist:
        return Response({"error": "Admin not found"}, status=404)
    _set_admin_account_status(admin_user, "rejected", False)
    return Response(AdminAccountSerializer(admin_user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def superadmin_suspend_admin(request, pk):
    """Suspend an active admin; they cannot log in until re-activated."""
    try:
        admin_user = User.objects.get(pk=pk, role="admin")
    except User.DoesNotExist:
        return Response({"error": "Admin not found"}, status=404)
    _set_admin_account_status(admin_user, "suspended", False)
    return Response(AdminAccountSerializer(admin_user).data)


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


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def create_attribute(request, subcategory_id):
    try:
        subcategory = Category.objects.get(id=subcategory_id, parent__isnull=False)
    except Category.DoesNotExist:
        return Response({"error": "Subcategory not found"}, status=status.HTTP_404_NOT_FOUND)
        
    data = request.data.copy()
    data["subcategory"] = subcategory.id
    
    serializer = AttributeWriteSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def update_attribute(request, pk):
    try:
        attribute = Attribute.objects.get(id=pk)
    except Attribute.DoesNotExist:
        return Response({"error": "Attribute not found"}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = AttributeWriteSerializer(attribute, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def delete_attribute(request, pk):
    try:
        attribute = Attribute.objects.get(id=pk)
    except Attribute.DoesNotExist:
        return Response({"error": "Attribute not found"}, status=status.HTTP_404_NOT_FOUND)
        
    attribute.delete()
    return Response({"message": "Attribute deleted"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def create_attribute_value(request, attribute_id):
    try:
        attribute = Attribute.objects.get(id=attribute_id)
    except Attribute.DoesNotExist:
        return Response({"error": "Attribute not found"}, status=status.HTTP_404_NOT_FOUND)
        
    data = request.data.copy()
    data["attribute"] = attribute.id
    
    serializer = AttributeValueWriteSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def update_attribute_value(request, pk):
    try:
        value = AttributeValue.objects.get(id=pk)
    except AttributeValue.DoesNotExist:
        return Response({"error": "Value not found"}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = AttributeValueWriteSerializer(value, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated, IsAdminOrSuperAdmin])
def delete_attribute_value(request, pk):
    try:
        value = AttributeValue.objects.get(id=pk)
    except AttributeValue.DoesNotExist:
        return Response({"error": "Value not found"}, status=status.HTTP_404_NOT_FOUND)
        
    value.delete()
    return Response({"message": "Value deleted"}, status=status.HTTP_200_OK)