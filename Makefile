setup:
	cp .env.example .env
	docker compose up -d db
	cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements/base.txt && python manage.py migrate

api:
	docker compose up --build api

mobile:
	cd mobile && npm install && npm run android

test:
	cd backend && python manage.py test

lint:
	cd backend && python -m compileall .
