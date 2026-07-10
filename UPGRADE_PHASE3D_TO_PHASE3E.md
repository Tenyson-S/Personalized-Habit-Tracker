# Upgrade Guide — Phase 3D to Hearth Phase 3E

## 1. Back up your project and database

Create a full project copy before merging.

Do not run:

```powershell
docker compose down -v
```

The `-v` flag can remove the PostgreSQL volume.

## 2. Merge the patch

Copy the Phase 3E patch into your current project and choose:

```text
Merge folders
Replace changed files
```

Keep your current:

```text
.env
mobile/.env
```

## 3. Backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
pip install -r requirements/base.txt
python manage.py check
python manage.py migrate
```

Expected new migration:

```text
habits.0003_habit_foundation_and_origin
```

Run tests:

```powershell
$env:USE_SQLITE="true"
python manage.py test
Remove-Item Env:USE_SQLITE -ErrorAction SilentlyContinue
```

Expected:

```text
40 tests
OK
```

Start your normal backend:

```powershell
python manage.py runserver 0.0.0.0:8000
```

## 4. Mobile

```powershell
cd mobile
npm install
npm run typecheck
npm run android
```

For a clean Metro cache:

```powershell
npx expo start --clear
```

## 5. Test the new flow

### New habit

Create:

```text
Read every evening
```

Choose:

```text
New habit
```

Confirm the Habit Dashboard shows:

```text
0 / 21 foundation
```

Complete one scheduled occurrence and confirm it becomes:

```text
1 / 21
```

Miss a scheduled day. The count must not reset.

### Existing habit

Create:

```text
Gym
```

Choose:

```text
Existing habit
```

Confirm it appears as established immediately.

### Persistence

Use an intentional schedule for several weeks. A week qualifies at 60% of the schedule. Missing one day should not automatically destroy persistence.

Sparse random check-ins across distant weeks must not create a persistence streak.

### Gesture navigation

Swipe horizontally:

```text
Today → Village → Journey → You
```

Then swipe back.

The bottom navigation indicator should stay synchronized.

### Splash

Test in a development or release Android build to see the full native Hearth splash and adaptive icon.
