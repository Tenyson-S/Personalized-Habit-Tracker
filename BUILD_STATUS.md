# Build Status — Hearth Phase 3E

## Release

**Hearth 0.5.0 — Identity, Persistence & Gesture Navigation**

## Source base

Built on the current Phase 3D repository state containing:

- silent ML auto-categorization,
- Habits / Dailies / Tasks,
- native date and time pickers,
- reminder fallback for Expo Go development,
- Village world and history,
- Chapters and Memories,
- Journey Insights.

## Implemented

### Brand and launch

- [x] App renamed from Village to Hearth
- [x] Central brand constants
- [x] Original Hearth mark
- [x] Native splash artwork
- [x] Android adaptive icon
- [x] Animated in-app opening screen
- [x] Stable Android package identifier preserved
- [x] Product copy updated to Hearth where it refers to the app

### Habit origin and foundation

- [x] New vs existing habit choice
- [x] `origin_type` persistence
- [x] Optional `existing_since`
- [x] 21-check-in foundation target
- [x] New-habit foundation does not reset on misses
- [x] Existing habits begin established
- [x] Off-schedule completions excluded from selected-day foundation progress
- [x] Weekly-target foundation capped by the intentional weekly target

### Persistence engine

- [x] Consistency percentage
- [x] Persistence streak in weeks
- [x] Longest persistence streak
- [x] 60% qualifying-week threshold
- [x] Current week remains provisional
- [x] Perfect run retained as secondary metric
- [x] Return/comeback count
- [x] Random sparse check-ins do not create persistence

### Habit dashboard

- [x] `GET /api/habits/dashboard/`
- [x] Private user-scoped dashboard
- [x] Summary records
- [x] Focus habit
- [x] 21-day foundation visual
- [x] Persistence and consistency metrics
- [x] 35-day scheduled history
- [x] Habit detail view
- [x] Established-rhythm state

### Today UI

- [x] Editorial habit-first layout
- [x] Personal greeting
- [x] Header add action
- [x] Persistence / consistency tiles
- [x] Focus habit card
- [x] Records & streaks dashboard entry
- [x] Scheduled Habits / Dailies / Tasks retained
- [x] Sleep controls retained
- [x] Yesterday vs Today retained
- [x] Activity manager retained

### Navigation

- [x] Horizontal swipe between Today / Village / Journey / You
- [x] Bottom nav stays synchronized
- [x] Edge resistance
- [x] Vertical scroll protection through horizontal-intent detection

### Analytics alignment

- [x] Long-term personal records now prioritize persistence rather than strict perfection

## Database migration

New migration:

```text
habits.0003_habit_foundation_and_origin
```

Adds:

- `origin_type`
- `existing_since`
- `foundation_target`

Existing user activity and habit completion history are preserved.

## Validation

- Django system check: **PASS**
- Migration drift check: **PASS**
- Backend automated tests: **40 / 40 PASS**
- TypeScript strict check: **PASS**
- Android production export: **PASS**
- Metro Android bundle: **921 modules**

## Test coverage added

- new habit foundation does not reset after a miss,
- off-schedule completions do not advance foundation,
- existing habits begin established,
- persistence survives a missed day inside a qualifying week,
- random sparse check-ins do not build persistence,
- dashboard remains private and exposes persistence metrics.

## Honest boundaries

- Persistence currently uses calendar weeks and a 60% qualification threshold. Real use should determine whether the threshold should become user-configurable later.
- Existing habits are marked established immediately; historical pre-Hearth completions are not fabricated.
- The custom swipe pager keeps all four primary screens mounted. This is appropriate for the current app size but should be revisited if future screens become memory-heavy.
- The model file was serialized with scikit-learn 1.9; the backend requirement has been aligned to `>=1.9,<2`.
- Reminder behavior still requires validation in a development/release Android build rather than Expo Go.
