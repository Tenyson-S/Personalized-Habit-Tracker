from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0002_userprofile_has_completed_guide'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='has_completed_guide',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='UserSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('theme', models.CharField(choices=[('SYSTEM', 'System'), ('LIGHT', 'Light'), ('DARK', 'Dark')], default='SYSTEM', max_length=10)),
                ('default_reminder_minutes', models.IntegerField(default=0)),
                ('habit_notifications_enabled', models.BooleanField(default=True)),
                ('daily_notifications_enabled', models.BooleanField(default=True)),
                ('task_notifications_enabled', models.BooleanField(default=True)),
                ('weekly_reflection_enabled', models.BooleanField(default=True)),
                ('monthly_reflection_enabled', models.BooleanField(default=True)),
                ('reduced_motion', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='settings', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
