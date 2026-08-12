import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from store.models import Product, ProductVariant

latest = Product.objects.order_by('-id').first()
print(f"Latest Product ID: {latest.id}")
print(f"Name: {latest.name}")
print(f"Price: {latest.price}")
print(f"Image: {latest.image}")
print(f"Gallery Images: {[img.image.url for img in latest.images.all()]}")

variants = latest.variants.all()
print(f"Variants count: {variants.count()}")
for v in variants:
    print(f"  Variant ID: {v.id}, Price: {v.price}, Image: {v.image}")
