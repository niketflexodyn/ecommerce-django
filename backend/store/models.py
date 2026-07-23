from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

from django.utils import timezone


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

    location = models.CharField(
        max_length=200,
        blank=True,
    )

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = "super_admin"
        elif self.is_staff:
            if self.role not in ("admin", "super_admin"):
                self.role = "admin"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class Category(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_categories",
    )

    def __str__(self):
        return self.name


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

    location = models.CharField(
        max_length=200,
        blank=True,
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

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_products",
    )
    shipping_days = models.PositiveIntegerField(default=5)
    dispatch_days = models.PositiveIntegerField(default=5)
    out_for_delivery_days = models.PositiveIntegerField(default=5)

    @property
    def estimated_delivery_days(self):
        return self.shipping_days + self.dispatch_days + self.out_for_delivery_days

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        related_name="images",
        on_delete=models.CASCADE,
    )
    image = models.ImageField(
        upload_to="products/",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"Image for {self.product.name}"


class Order(models.Model):

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("dispatched", "Dispatched"),
        ("out_for_delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    shipping_eta          = models.DateField(null=True, blank=True)
    dispatch_eta          = models.DateField(null=True, blank=True)
    out_for_delivery_eta  = models.DateField(null=True, blank=True)

    order_number = models.PositiveIntegerField(null=True, blank=True)

    status = models.CharField(
    max_length=20,
    choices=STATUS_CHOICES,
    default="pending",
    )
    estimated_delivery = models.DateField(
        null=True,
        blank=True
    )

    dispatched_at = models.DateTimeField(
        null=True,
        blank=True
    )

    delivered_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    payment_status = models.CharField(
    max_length=20,
    choices=[
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
    ],
    default="pending",
    )

    payment_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    razorpay_order_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    def save(self, *args, **kwargs):
        if self.status == "dispatched" and self.dispatched_at is None:
            self.dispatched_at = timezone.now()

        if self.status == "delivered" and self.delivered_at is None:
            self.delivered_at = timezone.now()

        super().save(*args, **kwargs)
    class Meta:
        unique_together = (("user", "order_number"),)

    def __str__(self):
        return f"Order #{self.order_number} ({self.user.username})"


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


class Rating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="ratings",
    )
    score = models.PositiveSmallIntegerField(
        choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} → {self.product.name} ({self.score})"