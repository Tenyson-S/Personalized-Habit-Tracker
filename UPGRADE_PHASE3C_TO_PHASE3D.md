# Upgrade — Phase 3C to Phase 3D

This upgrade is designed for the current repository version that already contains:

- silent ML auto-categorization,
- the expanded/retrained classifier seed data,
- native date/time pickers,
- Expo Go-safe reminder fallback.

## 1. Back up the working project

Create a complete copy before merging the patch.

## 2. Merge the Phase 3D patch

Copy the patch contents into the project root and choose:

- merge folders,
- replace changed files.

Keep your local environment files:

- `.env`
- `mobile/.env`

## 3. Update backend dependencies

No new Python package is required, but reinstalling from the lockless requirements file is safe:

```powershell
cd backend
.venv\Scripts\Activate.ps1
pip install -r requirements/base.txt
```

## 4. Run the migration

Phase 3D adds `DAILY` as a Village reward-event type.

```powershell
python manage.py check
python manage.py migrate
```

Expected new migration:

```text
village.0002_alter_rewardevent_event_type
```

Existing data is preserved.

## 5. Run backend regression tests

```powershell
$env:USE_SQLITE="true"
python manage.py test
Remove-Item Env:USE_SQLITE -ErrorAction SilentlyContinue
```

Expected result for this release:

```text
34 tests
OK
```

## 6. Update mobile dependencies

Phase 3D does not add a new runtime package, but the project version and lockfile changed.

```powershell
cd mobile
npm install
npm run typecheck
```

## 7. Start the app

Backend:

```powershell
python manage.py runserver 0.0.0.0:8000
```

Mobile:

```powershell
cd mobile
npm run android
```

Or use your existing Expo Go development workflow.

## 8. First verification flow

1. Open `Journey`.
2. Open `Insights`.
3. Switch between `7 days`, `30 days`, `90 days`, and `1 year`.
4. Complete a Habit, Daily, and Task.
5. Reopen Insights and confirm the life-area distribution changes.
6. Complete a Daily categorized as Rest and open Village.
7. Confirm the Hearth grows.
8. Create/complete a Life Admin activity and confirm the Windmill receives it.

## Notes

- No existing habit/task/chapter/memory data is deleted.
- Missing sleep remains `No record`; it is never displayed as `0h 0m`.
- The analytics engine is deterministic; no external AI API is required.
