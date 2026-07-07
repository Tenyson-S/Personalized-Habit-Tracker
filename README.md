# Project Village — Phase 1 (Seed)

A production-oriented foundation for a calm personal growth companion.

> Reflect the user. Do not manage them.

## What is implemented

### Backend

- Custom email-first user model
- Email/password registration and JWT auth
- Refresh-token logout with blacklist support
- Optional Google ID-token sign-in endpoint
- User profile and interests (`IMPROVE`, `ENJOY`, `CARE_ABOUT`)
- Habit scheduling, yes/no and measurable completions
- Streak, longest streak, total completion days, 30-day consistency
- One-time tasks
- Sleep start/wake sessions
- Today aggregation endpoint
- Daily, weekly, and monthly journey endpoints
- Non-shaming Village Seed state
- OpenAPI schema endpoint
- Automated domain/API tests

### Mobile

- Expo SDK 57 + TypeScript Android app shell
- Email registration/login
- Secure token persistence
- Bottom navigation: Today, Village, Journey, You
- Today query and quick habit/task completion
- Village Seed reflection screen
- Journey period switching
- API client with JWT refresh retry

## Repository structure

```text
project-village-phase1/
├── backend/         Django REST API
├── mobile/          Expo React Native app
├── PRODUCT_CONSTITUTION.md
├── PHASE1_PRD.md
├── docker-compose.yml
└── .env.example
```

## Quick start — backend with PostgreSQL

```bash
cp .env.example .env
docker compose up -d db

cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements/base.txt
python manage.py migrate
python manage.py runserver
```

API: `http://127.0.0.1:8000/api/`
Schema: `http://127.0.0.1:8000/api/schema/`

For fast tests without PostgreSQL:

```bash
cd backend
USE_SQLITE=true python manage.py test
```

## Quick start — Android

```bash
cd mobile
npm install
```

Create `mobile/.env`:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

Then:

```bash
npm run android
```

`10.0.2.2` is the Android emulator bridge to the host machine. On a physical phone, use your computer's LAN IP.

## First API flow

```text
POST /api/auth/register/
POST /api/auth/token/
GET  /api/me/
POST /api/interests/
POST /api/habits/
PUT  /api/habits/{id}/completion/{date}/
POST /api/tasks/
POST /api/sleep/start/
POST /api/sleep/wake/
GET  /api/today/
GET  /api/journey/weekly/
```

## Architectural decisions

- **Modular monolith first.** Clean boundaries without microservice overhead.
- **Server owns truth; mobile caches experience.** The Phase 1 client is online-first, with an offline action queue intentionally left for the hardening module.
- **No fake health precision.** Sleep analytics report duration and consistency only.
- **No punitive village states.** Low activity becomes quiet/resting, never damaged.
- **No coins in Phase 1.** Celebration is reflection, not a transaction.

See `BUILD_STATUS.md` for the exact working/remaining scope.

## Next build slice

1. Finish full onboarding UI.
2. Add create/edit forms for habits and tasks.
3. Add SQLite cache + offline mutation queue.
4. Add FCM reminders with strict notification budgets.
5. Add integration tests against PostgreSQL.
