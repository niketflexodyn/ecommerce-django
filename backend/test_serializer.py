import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from store.models import Product
from store.serializers import ProductSerializer
from django.test import RequestFactory

factory = RequestFactory()
request = factory.get('/api/admin/products/')
latest = Product.objects.order_by('-id').first()
serializer = ProductSerializer(latest, context={'request': request})
print(json.dumps(serializer.data, indent=2))
