# Phase 3E PRD — Identity, Persistence & Gesture Navigation

## Release name

**Hearth 0.5.0**

## Mission

Make the habit experience feel like the center of the product while changing streak logic from fragile perfection to intentional persistence.

> Consistency shows the pattern. Persistence shows that you kept returning.

## Product goals

1. Give the app a professional, ownable identity.
2. Make the opening experience feel intentional in an installed Android build.
3. Distinguish a new habit from one that already belongs to the user's life.
4. Give new habits a 21-check-in foundation that never resets on a miss.
5. Make persistence the primary streak while retaining a strict perfect run as a secondary record.
6. Prevent random off-schedule activity from manufacturing a streak.
7. Give habit records and history a dedicated visual dashboard.
8. Allow horizontal swiping between the four main navigation destinations.

## Brand

### App name

**Hearth**

### Promise

**Build your life. Keep returning.**

### Launch line

**Keep returning.**

The village remains the user's world inside Hearth. The product is no longer named after the world itself.

## Habit origin

Every Habit has an origin type.

### New habit

The user is trying to bring something new into their life.

- starts a 21-check-in foundation,
- only intentional scheduled completions count,
- a missed day never resets progress,
- off-schedule random completions do not advance selected-day foundations.

### Existing habit

The habit already belonged to the user's life before Hearth started observing it.

- it begins established,
- earlier effort is not erased or re-labeled as zero,
- Hearth starts reflecting from the point the user adds it.

## Habit measures

### Consistency

Scheduled completion rate over a time window.

### Persistence

The main streak.

A calendar week qualifies when the user completes at least 60% of the intentional schedule or weekly target. The current unfinished week is provisional and cannot break the streak early.

This means:

- one missed day can survive,
- returning matters,
- random single check-ins across distant weeks do not create persistence.

### Perfect run

The old strict consecutive streak. It remains visible as a smaller secondary record.

### Returns

The number of times the habit came back after a quiet gap.

## 21-day foundation

The foundation is a progress counter, not a punishment loop.

```text
New Habit
   ↓
21 intentional scheduled check-ins
   ↓
Established
```

A miss does not reset the counter.

## Habit dashboard

The dashboard includes:

- strongest persistence,
- 30-day average consistency,
- active / foundation / established habit counts,
- 21-day foundation progress,
- per-habit persistence,
- perfect run,
- return count,
- 35-day scheduled history,
- records without a leaderboard.

## Today redesign

The Today screen adopts an editorial habit-first hierarchy:

- personal greeting,
- large calm typography,
- add button in the header,
- persistence and consistency tiles,
- one focused habit card,
- records & streaks entry,
- scheduled Habits / Dailies / Tasks,
- compact rest state,
- personal comparison.

The visual direction is inspired by editorial mobile layouts, but the interface remains original to Hearth.

## Gesture navigation

The four main destinations remain:

```text
Today
Village
Journey
You
```

Users can:

- tap the bottom navigation,
- swipe horizontally between adjacent destinations.

The swipe recognizer only captures clearly horizontal motion so vertical screen scrolling remains usable.

## Splash and installed-app identity

The release includes:

- display name `Hearth`,
- native splash artwork,
- adaptive Android icon,
- matching launch background,
- animated in-app brand reveal.

The Android package identifier is intentionally preserved so existing development/release installs can upgrade rather than becoming a separate app.

## API

### Habit dashboard

```text
GET /api/habits/dashboard/
```

Returns private user-scoped dashboard data, foundation state, persistence metrics, and 35-day history.

### Existing Habit Journey

```text
GET /api/habits/{id}/journey/
```

Now also returns:

- foundation,
- persistence streak,
- longest persistence,
- perfect run,
- returns.

## Non-goals

Phase 3E does not add:

- public competition,
- leaderboards,
- social streak comparison,
- paid streak freezes,
- AI coaching,
- automatic habit recommendations.
