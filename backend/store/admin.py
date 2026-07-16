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


admin.site.register(User, CustomUserAdmin)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderItem)