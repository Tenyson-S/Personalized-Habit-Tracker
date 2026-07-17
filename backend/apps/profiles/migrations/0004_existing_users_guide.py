from django.db import migrations

def mark_existing_users_guide_completed(apps, schema_editor):
    UserProfile = apps.get_model('profiles', 'UserProfile')
    # Mark existing profiles (created before this migration) as completed
    UserProfile.objects.update(has_completed_guide=True)


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0003_usersettings'),
    ]

    operations = [
        migrations.RunPython(mark_existing_users_guide_completed, reverse_code=migrations.RunPython.noop),
    ]
