from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User,
    Category,
    Product,
    Cart,
    CartItem,
    Order,
    OrderItem,
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


class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "shipping_days", "dispatch_days",
                    "out_for_delivery_days", "estimated_delivery_days_display")
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
admin.site.register(Category)
admin.site.register(Product, ProductAdmin)
admin.site.register(Order, OrderAdmin)