from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("habits", "0002_habit_preferred_time_habit_reminder_enabled_and_more")]

    operations = [
        migrations.AddField(
            model_name="habit",
            name="origin_type",
            field=models.CharField(
                choices=[("NEW", "New to my life"), ("EXISTING", "Already part of my life")],
                default="NEW",
                max_length=12,
            ),
        ),
        migrations.AddField(
            model_name="habit",
            name="existing_since",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="habit",
            name="foundation_target",
            field=models.PositiveSmallIntegerField(default=21),
        ),
    ]
