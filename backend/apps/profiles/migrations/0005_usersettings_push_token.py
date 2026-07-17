# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("profiles", "0004_existing_users_guide"),
    ]

    operations = [
        migrations.AddField(
            model_name="usersettings",
            name="push_token",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
