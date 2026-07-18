import uuid
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings



class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        from django.db import transaction
        from apps.profiles.models import UserProfile, UserSettings
        
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        
        with transaction.atomic():
            user = self.model(email=email, **extra_fields)
            if password:
                user.set_password(password)
            else:
                user.set_unusable_password()
            user.save(using=self._db)
            
            UserProfile.objects.create(user=user)
            UserSettings.objects.create(user=user)
            
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class AuthProvider(models.TextChoices):
        EMAIL = "EMAIL", "Email"
        GOOGLE = "GOOGLE", "Google"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=80, blank=True)
    timezone = models.CharField(max_length=64, default="Asia/Kolkata")
    auth_provider = models.CharField(max_length=12, choices=AuthProvider.choices, default=AuthProvider.EMAIL)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    def __str__(self):
        return self.email

class IdempotencyRecord(models.Model):
    idempotency_key = models.CharField(max_length=128, unique=True, primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='idempotency_records')
    response_code = models.IntegerField()
    response_body = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)
