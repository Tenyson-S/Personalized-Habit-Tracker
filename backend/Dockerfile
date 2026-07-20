FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings

WORKDIR /app
COPY requirements/base.txt /app/requirements/base.txt
RUN pip install --no-cache-dir -r /app/requirements/base.txt
COPY . /app

# Collect static files for Django Admin & Whitenoise
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000
CMD ["sh", "-c", "gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --timeout 120 --access-logfile - --error-logfile -"]