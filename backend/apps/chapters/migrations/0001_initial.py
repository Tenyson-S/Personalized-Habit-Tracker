import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Chapter',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=120)),
                ('description', models.TextField(blank=True)),
                ('intention', models.TextField(blank=True)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(choices=[('ACTIVE', 'Active'), ('CLOSED', 'Closed')], db_index=True, default='ACTIVE', max_length=8)),
                ('reflection', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chapters', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('-start_date', '-created_at'),
            },
        ),
        migrations.CreateModel(
            name='ChapterFocus',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('life_area', models.CharField(choices=[('LEARNING', 'Learning'), ('HEALTH', 'Health'), ('SLEEP', 'Sleep'), ('CAREER', 'Career'), ('MINDFULNESS', 'Mindfulness'), ('CREATIVITY', 'Creativity'), ('RELATIONSHIPS', 'Relationships'), ('PERSONAL_GROWTH', 'Personal growth'), ('OTHER', 'Other')], max_length=20)),
                ('note', models.CharField(blank=True, max_length=220)),
                ('position', models.PositiveSmallIntegerField(default=0)),
                ('chapter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='focuses', to='chapters.chapter')),
            ],
            options={
                'ordering': ('position',),
            },
        ),
        migrations.AddConstraint(
            model_name='chapter',
            constraint=models.UniqueConstraint(condition=models.Q(status='ACTIVE'), fields=('user',), name='unique_active_chapter_per_user'),
        ),
    ]
