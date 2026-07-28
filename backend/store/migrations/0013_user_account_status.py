"""Add account_status field to User for the admin approval workflow.

Admins register as 'pending' and are blocked from logging in (is_active=False)
until a super admin activates, rejects, or suspends the account. Existing users
default to 'active' so current customers, admins, and super admins are unaffected.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0012_order_dispatch_eta_order_out_for_delivery_eta_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="account_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("active", "Active"),
                    ("rejected", "Rejected"),
                    ("suspended", "Suspended"),
                ],
                default="active",
                max_length=20,
            ),
        ),
    ]