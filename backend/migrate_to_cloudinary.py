import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import cloudinary
import cloudinary.uploader
from django.conf import settings
from store.models import Product, ProductImage

cloudinary.config(
    cloud_name=settings.CLOUDINARY_STORAGE.get("CLOUD_NAME"),
    api_key=settings.CLOUDINARY_STORAGE.get("API_KEY"),
    api_secret=settings.CLOUDINARY_STORAGE.get("API_SECRET"),
    secure=True
)

def migrate_images():
    print("Starting migration to Cloudinary...\n")

    # 1. Migrate Main Product Images
    products = Product.objects.exclude(image="").exclude(image__isnull=True)
    for p in products:
        # Check if the image is already a Cloudinary URL
        if str(p.image).startswith("http://") or str(p.image).startswith("https://"):
            print(f"[-] Skipping Product #{p.id} ({p.name}) - already on Cloudinary.")
            continue

        local_path = os.path.join(settings.BASE_DIR, "media", str(p.image))
        if os.path.exists(local_path):
            print(f"[+] Uploading image for Product #{p.id} ({p.name})...")
            try:
                # Upload to Cloudinary under folder 'products'
                res = cloudinary.uploader.upload(local_path, folder="products")
                # Update the product with the uploaded image's public path / url
                p.image = res['public_id']
                p.save(update_fields=['image'])
                print(f"    ✓ Uploaded: {res['secure_url']}")
            except Exception as e:
                print(f"    ✗ Failed to upload {local_path}: {e}")
        else:
            print(f"    ! Local file not found: {local_path}")

    # 2. Migrate Gallery ProductImage objects (if any)
    gallery_images = ProductImage.objects.exclude(image="").exclude(image__isnull=True)
    for img in gallery_images:
        if str(img.image).startswith("http://") or str(img.image).startswith("https://"):
            continue

        local_path = os.path.join(settings.BASE_DIR, "media", str(img.image))
        if os.path.exists(local_path):
            print(f"[+] Uploading gallery image for Product #{img.product_id}...")
            try:
                res = cloudinary.uploader.upload(local_path, folder="products")
                img.image = res['public_id']
                img.save(update_fields=['image'])
                print(f"    ✓ Uploaded: {res['secure_url']}")
            except Exception as e:
                print(f"    ✗ Failed: {e}")

    print("\nMigration completed!")

if __name__ == "__main__":
    migrate_images()
