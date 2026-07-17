# Generated for per-customer sequential order numbers

from django.db import migrations, models


def backfill_order_numbers(apps, schema_editor):
    """Assign 1..N order_number per customer, oldest order first."""
    Order = apps.get_model('store', 'Order')
    # Group orders by user, ordered by creation (then id) for a stable sequence.
    orders = Order.objects.order_by('user_id', 'created_at', 'id')
    current_user = None
    next_number = 0
    for order in orders:
        if order.user_id != current_user:
            current_user = order.user_id
            next_number = 1
        else:
            next_number += 1
        order.order_number = next_number
        order.save(update_fields=['order_number'])


def remove_order_numbers(apps, schema_editor):
    Order = apps.get_model('store', 'Order')
    Order.objects.update(order_number=None)


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0004_rating'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='order_number',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AlterUniqueTogether(
            name='order',
            unique_together={('user', 'order_number')},
        ),
        migrations.RunPython(backfill_order_numbers, remove_order_numbers),
    ]