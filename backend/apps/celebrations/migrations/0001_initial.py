import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('profiles', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CelebrationPreference',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=100)),
                ('category', models.CharField(choices=[('SMALL_JOY', 'Small joy'), ('EXPERIENCE', 'Experience'), ('CONNECTION', 'People and connection'), ('PLACE', 'Place and outing')], default='SMALL_JOY', max_length=20)),
                ('note', models.CharField(blank=True, max_length=220)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('source_interest', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='celebration_preferences', to='profiles.userinterest')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='celebration_preferences', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('category', 'title'),
            },
        ),
        migrations.CreateModel(
            name='CelebrationReflection',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('period_type', models.CharField(choices=[('WEEKLY', 'Weekly'), ('MONTHLY', 'Monthly')], max_length=12)),
                ('period_start', models.DateField()),
                ('status', models.CharField(choices=[('SUGGESTED', 'Suggested'), ('MAYBE_LATER', 'Maybe later'), ('COMPLETED', 'Completed'), ('DISMISSED', 'Dismissed')], default='SUGGESTED', max_length=16)),
                ('prompt_text', models.TextField()),
                ('responded_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('preference', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reflections', to='celebrations.celebrationpreference')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='celebration_reflections', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('-period_start', '-created_at'),
            },
        ),
        migrations.AddConstraint(
            model_name='celebrationpreference',
            constraint=models.UniqueConstraint(fields=('user', 'title'), name='unique_user_celebration_preference'),
        ),
        migrations.AddConstraint(
            model_name='celebrationreflection',
            constraint=models.UniqueConstraint(fields=('user', 'period_type', 'period_start'), name='unique_celebration_reflection_period'),
        ),
    ]
