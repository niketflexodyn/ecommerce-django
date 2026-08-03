from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('store', '0019_wishlist'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE store_product DROP COLUMN IF EXISTS attributes;
            ALTER TABLE store_product DROP COLUMN IF EXISTS subcategory;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
