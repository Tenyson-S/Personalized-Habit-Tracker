import json
from django.http import HttpResponse, JsonResponse
from apps.accounts.models import IdempotencyRecord

class IdempotencyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method not in ["POST", "PUT", "PATCH", "DELETE"]:
            return self.get_response(request)

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key or not request.user.is_authenticated:
            return self.get_response(request)

        # Check if we already processed this
        try:
            record = IdempotencyRecord.objects.get(idempotency_key=idempotency_key, user=request.user)
            # Return the cached response
            if record.response_body is not None:
                return JsonResponse(record.response_body, status=record.response_code)
            return HttpResponse(status=record.response_code)
        except IdempotencyRecord.DoesNotExist:
            pass

        response = self.get_response(request)

        # Only cache successful responses (2xx) or explicit 4xx to prevent infinite retry of bad requests
        # We don't cache 500s because they might succeed on retry
        if 200 <= response.status_code < 500:
            body = None
            if hasattr(response, 'content') and response.content:
                try:
                    body = json.loads(response.content.decode('utf-8'))
                except (ValueError, UnicodeDecodeError):
                    pass # Keep as None if not JSON
            
            # Save it
            IdempotencyRecord.objects.update_or_create(
                idempotency_key=idempotency_key,
                user=request.user,
                defaults={
                    'response_code': response.status_code,
                    'response_body': body
                }
            )

        return response
