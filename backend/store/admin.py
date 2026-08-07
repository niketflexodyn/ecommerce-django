from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# pyrefly: ignore [missing-import]
from .models import (
    User,
    Category,
    SubCategory,
    Product,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Attribute,
    AttributeValue,
    ProductAttribute,
    Discount,
    ProductVariant,
    VariantAttribute
)


class CustomUserAdmin(UserAdmin):
    """Custom admin for the User model with role, phone, address fields."""

    fieldsets = UserAdmin.fieldsets + (
        (
            "Extra Info",
            {
                "fields": ("role", "phone", "address"),
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Extra Info",
            {
                "fields": ("role", "phone", "address"),
            },
        ),
    )
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_active")


class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    extra = 1

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    show_change_link = True

class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "shipping_days", "dispatch_days",
                    "out_for_delivery_days", "estimated_delivery_days_display")
    inlines = [ProductAttributeInline, ProductVariantInline]
    list_filter = ("category",)
    search_fields = ("name", "description")
    fieldsets = (
        (None, {
            "fields": ("category", "name", "description", "price", "location", "image"),
        }),
        ("Shipping timeline (days)", {
            "description": "Per-stage durations used to compute the customer-facing "
                           "delivery timeline when an order is placed.",
            "fields": ("shipping_days", "dispatch_days", "out_for_delivery_days"),
        }),
    )

    @admin.display(ordering="shipping_days", description="Total delivery days")
    def estimated_delivery_days_display(self, obj):
        return obj.estimated_delivery_days


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "quantity", "price")


class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "payment_status",
                    "estimated_delivery", "created_at")
    list_filter = ("status", "payment_status")
    search_fields = ("order_number", "user__username", "user__email")
    readonly_fields = ("shipping_eta", "dispatch_eta", "out_for_delivery_eta",
                        "estimated_delivery", "dispatched_at", "delivered_at",
                        "created_at")
    inlines = [OrderItemInline]


admin.site.register(User, CustomUserAdmin)
class CategoryAdmin(admin.ModelAdmin):
    exclude = ('parent',)
    
    def get_queryset(self, request):
        # Only show parent categories
        qs = super().get_queryset(request)
        return qs.filter(parent__isnull=True)

class SubCategoryAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        # Only show subcategories
        qs = super().get_queryset(request)
        return qs.filter(parent__isnull=False)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "parent":
            kwargs["queryset"] = Category.objects.filter(parent__isnull=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

class AttributeValueInline(admin.TabularInline):
    model = AttributeValue
    extra = 3

class AttributeAdmin(admin.ModelAdmin):
    list_display = ("name", "subcategory")
    list_filter = ("subcategory",)
    search_fields = ("name",)
    inlines = [AttributeValueInline]

class VariantAttributeInline(admin.TabularInline):
    model = VariantAttribute
    extra = 2

class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("product", "sku", "price", "stock", "is_active")
    list_filter = ("is_active", "product__category")
    search_fields = ("sku", "product__name")
    inlines = [VariantAttributeInline]

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):

    list_display = (
        "variant",
        "discount_type",
        "value",
        "is_active",
    )

    list_filter = (
        "discount_type",
        "is_active",
    )

    search_fields = (
        "variant__sku",
        "variant__product__name",
    )

admin.site.register(Category, CategoryAdmin)
admin.site.register(SubCategory, SubCategoryAdmin)
admin.site.register(Attribute, AttributeAdmin)
admin.site.register(AttributeValue)
admin.site.register(Product, ProductAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(ProductVariant, ProductVariantAdmin)
admin.site.register(VariantAttribute)
