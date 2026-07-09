# Phase 3D PRD — Personal Insight & Statistics Engine

## Product intent

Phase 3D turns private activity history into understandable personal patterns.

> Facts first. Gentle observations second. No score decides whether the user is doing life correctly.

Village now has enough longitudinal data to answer:

- What parts of life have been most visible recently?
- On which days and times does activity naturally appear?
- How do task deadlines tend to be handled?
- Which habits and dailies have formed a rhythm?
- When did the user return after a quiet gap?
- What changed compared with the previous period?

The engine must never:

- rank the user against other people,
- assign a universal productivity score,
- diagnose personality or health,
- shame quieter periods,
- turn memories into performance metrics,
- use an LLM for facts that deterministic analytics can calculate.

---

## Canonical life-area taxonomy

Phase 3D standardizes analytics around nine categories:

1. `PERSONAL_GROWTH` — Personal Growth & Identity
2. `RELATIONSHIPS` — Relationships & Connection
3. `CREATIVITY` — Creativity & Craft
4. `HEALTH` — Health & Nourishment
5. `MINDFULNESS` — Mindfulness & Inner Calm
6. `REST` — Rest & Personal Stability
7. `LEARNING` — Learning & Knowledge
8. `CAREER` — Career & Long-Term Direction
9. `LIFE_ADMIN` — Everything Else That Keeps Life Moving

Legacy data remains compatible:

- `SLEEP` is normalized to `REST`.
- `OTHER` is normalized to `LIFE_ADMIN`.

The same normalization now applies to Village growth and World History.

---

## Backend scope

### Analytics overview

`GET /api/analytics/overview/?period=7d|30d|90d|1y`

Returns:

- active days,
- habit completions,
- daily completions,
- tasks completed,
- sleep sessions,
- average recorded sleep,
- memories kept,
- total visible actions,
- previous-period comparison,
- nine-area distribution,
- deterministic observations,
- active chapter context.

### Rhythm

`GET /api/analytics/rhythm/?period=...`

Returns:

- Monday–Sunday activity matrix by life area,
- time-of-day activity buckets,
- dominant weekday/time observations.

### Tasks

`GET /api/analytics/tasks/?period=...`

Returns:

- created/completed/open tasks,
- recurring completions,
- average completion time,
- early / near-due / late deadline behavior,
- priority distribution,
- life-area distribution,
- non-judgmental task-timing reflection.

Deadline classification:

- **Early:** completed at least 24 hours before due time.
- **Near due:** completed by the deadline and within 24 hours of it.
- **Late:** completed after the due time.

### Habit detail

`GET /api/analytics/habits/{id}/?period=...`

Supports:

- selected-day habits,
- weekly-target habits,
- scheduled/completed opportunities,
- completion rate,
- current and longest rhythm,
- best weekday,
- lifetime completion count,
- comeback count.

### Daily detail

`GET /api/analytics/dailies/{id}/?period=...`

Returns:

- scheduled days,
- completed days,
- completion rate,
- current/longest rhythm,
- weekday pattern,
- best and quietest weekday,
- comeback count.

### Personal records

`GET /api/analytics/records/`

The UI calls these “Things that became visible.” Records include:

- longest habit rhythm,
- most visible day,
- most visible life area,
- most tasks completed in one week.

These are historical observations, not achievements the user must beat.

### Self-comparison

`GET /api/analytics/compare/?period=day|week|month`

Returns current vs previous period and life-area deltas.

---

## Deterministic insight engine

Phase 3D does not use generative AI.

Insights are built from tested rules such as:

- most visible life area,
- more/fewer active days,
- meaningful average-sleep change,
- deadline timing pattern,
- quiet period handling.

Benefits:

- private,
- fast,
- testable,
- predictable,
- no hallucinations,
- no inference beyond the available data.

---

## Village integration corrections

Phase 3D also fixes two integration gaps introduced as the activity engine evolved.

### Dailies now grow the Village

Completed Dailies create idempotent `DAILY` reward events and grow their corresponding life-area building.

### Canonical ML categories now reach the correct buildings

- `REST` → Hearth
- `LIFE_ADMIN` → Windmill

Legacy aliases continue to work.

---

## Mobile scope

Journey now contains:

- Daily
- Weekly
- Monthly
- **Insights**
- Story

The Insights experience includes:

1. 7 / 30 / 90 day and 1 year filters.
2. Calm summary metrics.
3. Deterministic observations.
4. Life-area visibility bars.
5. Weekly rhythm matrix.
6. Time-of-day pattern summary.
7. Task deadline behavior.
8. Personal records.

No charting dependency was added. The first release uses lightweight native views for performance and design consistency.

---

## Privacy boundary

All analytics queries are scoped to the authenticated user.

Tests explicitly verify that another user’s:

- completions,
- streaks,
- records,
- rhythm data

cannot appear in the current user’s analytics.

---

## Out of scope for Phase 3D

- LLM-generated coaching,
- predictive burnout diagnosis,
- social comparison,
- leaderboards,
- universal productivity scores,
- health diagnosis,
- automatic behavior prescriptions,
- cloud data warehouse,
- complex BI infrastructure.

---

## Release gate

Phase 3D is considered complete when:

- all previous-phase tests still pass,
- analytics endpoints are user-private,
- missing sleep is represented as missing, not zero,
- legacy categories map to the canonical nine-area taxonomy,
- Dailies visibly grow the Village,
- deterministic insights never shame the user,
- TypeScript passes,
- Android production export succeeds.
