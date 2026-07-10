# Hearth — Phase 3E

**Build your life. Keep returning.**

Hearth is a private personal-growth companion that reflects real activity through Habits, Dailies, Tasks, Sleep, a living village, personal history, and calm insights.

> Reflect the user. Do not manage them.

## Phase 3E highlight

This release changes the habit philosophy from fragile perfection to intentional persistence.

```text
Consistency
shows the pattern
        ↓
Persistence
shows that you kept returning
```

### New habits

A new habit builds a 21-check-in foundation.

- misses do not reset progress,
- only intentional schedule-aligned check-ins count,
- random off-schedule activity cannot manufacture a streak.

### Existing habits

If a habit already belongs to the user's life, Hearth starts it established instead of pretending the earlier effort never happened.

### Habit records

The new dashboard shows:

- persistence weeks,
- 30-day consistency,
- perfect run,
- return count,
- 21-day foundation,
- 35-day history.

## App identity

The app is now named **Hearth**.

The village remains the world that reflects the user's life.

The Android package identifier remains unchanged so current installs can upgrade.

## Navigation

Primary destinations:

```text
Today
Village
Journey
You
```

Users can tap the bottom navigation or swipe horizontally between adjacent destinations.

## New API

```text
GET /api/habits/dashboard/
```

Existing journey endpoint also exposes persistence and foundation metrics:

```text
GET /api/habits/{id}/journey/
```

## Quick start — backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements/base.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Tests:

```powershell
$env:USE_SQLITE="true"
python manage.py test
```

## Quick start — mobile

```powershell
cd mobile
npm install
npm run typecheck
npm run android
```

Physical phone backend URL:

```text
EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:8000/api
```

## Product layers

```text
Activity
Habits · Dailies · Tasks · Sleep
        ↓
Understanding
Silent ML life-area categorization
        ↓
Habit identity
Foundation · Consistency · Persistence · Returns
        ↓
Reflection
Today · Journey · Insights
        ↓
World
Village · Buildings · World History
        ↓
Story
Chapters · Memories · Personal celebrations
```

## Product documents

- `PRODUCT_CONSTITUTION.md`
- `PHASE3D_PRD.md`
- `PHASE3E_PRD.md`
- `BUILD_STATUS.md`
- `UPGRADE_PHASE3D_TO_PHASE3E.md`

## Version

**Hearth 0.5.0 — Phase 3E**
