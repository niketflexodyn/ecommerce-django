from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser


# -------------------------
# Custom User Model
# -------------------------

class User(AbstractUser):
    ROLE_CHOICES = (
        ("customer", "Customer"),
        ("admin", "Admin"),
        ("super_admin", "Super Admin"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="customer",
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
    )

    address = models.TextField(
        blank=True,
    )

    def __str__(self):
        return self.username


# -------------------------
# Category
# -------------------------

class Category(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


# -------------------------
# Product
# -------------------------

class Product(models.Model):
    category = models.ForeignKey(
        Category,
        related_name="products",
        on_delete=models.CASCADE,
    )

    name = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.name


# -------------------------
# Order
# -------------------------

class Order(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    def __str__(self):
        return f"Order {self.id}"


# -------------------------
# Order Items
# -------------------------

class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        related_name="items",
        on_delete=models.CASCADE,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
    )

    quantity = models.PositiveIntegerField(default=1)

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    def __str__(self):
        return f"{self.quantity} × {self.product.name}"


# -------------------------
# Cart
# -------------------------

class Cart(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="carts",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"Cart {self.id}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())


# -------------------------
# Cart Item
# -------------------------

class CartItem(models.Model):

    cart = models.ForeignKey(
        Cart,
        related_name="items",
        on_delete=models.CASCADE,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
    )

    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} × {self.product.name}"

    @property
    def subtotal(self):
        return self.product.price * self.quantity