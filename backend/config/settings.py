from datetime import timedelta
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"
if not DEBUG:
    SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
    
    allowed = os.getenv("DJANGO_ALLOWED_HOSTS", "")
    if not allowed or allowed == "*":
        raise ValueError("DJANGO_ALLOWED_HOSTS must be set securely in production")
    ALLOWED_HOSTS = [h.strip() for h in allowed.split(",") if h.strip()]
else:
    SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me-use-a-long-random-secret-key-2026")
    ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "apps.accounts",
    "apps.profiles",
    "apps.habits",
    "apps.tasks",
    "apps.sleep",
    "apps.progress",
    "apps.village",
    "apps.chapters",
    "apps.memories",
    "apps.celebrations",
    "apps.world_history",
    "apps.classification",
    "apps.dailies",
    "apps.analytics",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.accounts.middleware.IdempotencyMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "templates"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "config.wsgi.application"

import dj_database_url

if not DEBUG and not (os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DB_URI")):
    raise ValueError("DATABASE_URL must be set in production")

DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DB_URI") or f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=60,
        conn_health_checks=True,
    )
}

# Production Security Defaults
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG
SECURE_REDIRECT_EXEMPT = [r"^health/$"]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

import os
os.makedirs(STATIC_ROOT, exist_ok=True)
WHITENOISE_MANIFEST_STRICT = False
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",) if not DEBUG else (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Stealth Track API",
    "DESCRIPTION": "Stealth Track API for habits, dailies, tasks, sleep, chapters, village progress, and analytics.",
    "VERSION": "1.0.0",
}

if not DEBUG:
    cors_allowed = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if not cors_allowed or cors_allowed == "*":
        raise ValueError("CORS_ALLOWED_ORIGINS must be set securely in production")
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_allowed.split(",") if o.strip()]
    CORS_ALLOW_ALL_ORIGINS = False
else:
    # In local dev, allow all origins for maximum convenience
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = []

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "idempotency-key",  # Required for our offline sync engine
]
CSRF_TRUSTED_ORIGINS = (
    CORS_ALLOWED_ORIGINS
    if not DEBUG else
    ["https://stealth-tracker-rho.vercel.app"]
)
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")

# Direct APK update metadata. The update remains disabled until a valid HTTPS
# APK URL is configured, preventing deployment from advertising a missing file.
APP_UPDATE_VERSION_CODE = int(os.getenv("APP_UPDATE_VERSION_CODE", "6"))
APP_UPDATE_VERSION_NAME = os.getenv("APP_UPDATE_VERSION_NAME", "1.0.4")
APP_UPDATE_APK_URL = os.getenv("APP_UPDATE_APK_URL", "").strip()
APP_UPDATE_SHA256 = os.getenv("APP_UPDATE_SHA256", "").strip().upper()
APP_UPDATE_REQUIRED = os.getenv("APP_UPDATE_REQUIRED", "false").lower() == "true"
APP_UPDATE_RELEASE_NOTES = os.getenv("APP_UPDATE_RELEASE_NOTES", "A new version is available.")

# Production Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}
