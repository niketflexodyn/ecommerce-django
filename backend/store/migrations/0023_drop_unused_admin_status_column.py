from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0022_productvariant_image_productvariant_is_active"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE store_user DROP COLUMN IF EXISTS admin_status;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
