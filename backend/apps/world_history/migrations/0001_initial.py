import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('chapters', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='WorldSnapshot',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('snapshot_type', models.CharField(choices=[('MONTHLY', 'Monthly'), ('CHAPTER_END', 'Chapter end')], max_length=16)),
                ('period_key', models.CharField(max_length=80)),
                ('captured_on', models.DateField()),
                ('village_stage', models.CharField(max_length=24)),
                ('total_xp', models.PositiveIntegerField(default=0)),
                ('environment_state', models.CharField(max_length=20)),
                ('weather', models.CharField(max_length=20)),
                ('building_states', models.JSONField(default=list)),
                ('unlocks', models.JSONField(default=list)),
                ('summary', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('chapter', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='world_snapshots', to='chapters.chapter')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='world_snapshots', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('-captured_on', '-created_at'),
            },
        ),
        migrations.AddConstraint(
            model_name='worldsnapshot',
            constraint=models.UniqueConstraint(fields=('user', 'snapshot_type', 'period_key'), name='unique_world_snapshot_period'),
        ),
    ]
