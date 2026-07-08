import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('chapters', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Memory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=140)),
                ('description', models.TextField(blank=True, max_length=1200)),
                ('memory_type', models.CharField(
                    choices=[
                        ('MOMENT', 'Moment'),
                        ('MILESTONE', 'Milestone'),
                        ('PEOPLE', 'People'),
                        ('EXPERIENCE', 'Experience'),
                        ('PERSONAL_CHANGE', 'Personal change'),
                    ],
                    default='MOMENT',
                    max_length=20,
                )),
                ('happened_on', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('chapter', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='memories',
                    to='chapters.chapter',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='memories',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ('-happened_on', '-created_at'),
            },
        ),
    ]
