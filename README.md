# Project Village — Phase 3D

A private personal-growth companion that turns real-life activity into a living village, life chapters, memories, and now personal patterns.

> Reflect the user. Do not manage them.

## Current product layers

```text
Activity
Habits · Dailies · Tasks · Sleep
        ↓
Understanding
Silent ML life-area categorization
        ↓
Reflection
Today · Journey · Insights
        ↓
World
Buildings · Progress · World History
        ↓
Story
Chapters · Memories · Personal celebrations
```

## Phase 3D highlight

Journey now includes **Insights**.

The analytics engine combines:

- Habits,
- Dailies,
- Tasks,
- Sleep,
- Memories,
- nine life areas

and returns deterministic, private observations.

No social comparison. No universal productivity score. No LLM-generated advice.

## Analytics endpoints

```text
GET /api/analytics/overview/?period=30d
GET /api/analytics/rhythm/?period=30d
GET /api/analytics/tasks/?period=30d
GET /api/analytics/records/
GET /api/analytics/compare/?period=week
GET /api/analytics/habits/{id}/?period=30d
GET /api/analytics/dailies/{id}/?period=30d
```

Supported periods:

```text
7d
30d
90d
1y
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

Fast regression tests:

```powershell
$env:USE_SQLITE="true"
python manage.py test
```

## Quick start — mobile

```powershell
cd mobile
npm install
npm run android
```

Create `mobile/.env` with your backend URL.

Android emulator:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

Physical device on the same network:

```text
EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:8000/api
```

## Repository structure

```text
backend/
  apps/
    analytics/       Phase 3D facts and deterministic insights
    classification/  TF-IDF + Logistic Regression inference
    habits/
    dailies/
    tasks/
    sleep/
    village/
    chapters/
    memories/
    celebrations/
    world_history/

mobile/
  src/features/
    today/
    village/
    journey/
      InsightsPanel.tsx
      StoryPanel.tsx

ml/
  data/seed.csv
  src/train.py
```

## Product documents

- `PRODUCT_CONSTITUTION.md`
- `PHASE3D_PRD.md`
- `BUILD_STATUS.md`
- `UPGRADE_PHASE3C_TO_PHASE3D.md`

## Version

Phase 3D release: `0.4.0`
