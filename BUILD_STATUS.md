# Build Status — Phase 1 Seed

## Working now

### Backend vertical slice

- [x] Email registration/login
- [x] JWT access/refresh rotation and logout blacklist
- [x] Google ID-token verification endpoint (requires OAuth client configuration)
- [x] Profile and onboarding interests
- [x] Daily / selected-weekday habit model
- [x] Boolean and measurable habit completion
- [x] Current streak, longest streak, lifetime completion days
- [x] 30-day and 90-day consistency
- [x] One-time task CRUD and completion
- [x] Manual sleep start/wake
- [x] Sleep duration and consistency summary
- [x] Today aggregate endpoint
- [x] Yesterday vs today comparison
- [x] Daily / weekly / monthly journey comparisons
- [x] Village Seed state: Quiet / Resting / Stable / Growing / Blooming
- [x] OpenAPI schema
- [x] Automated API/domain tests

### Android client vertical slice

- [x] Expo SDK 57 + React Native + TypeScript
- [x] Secure JWT persistence
- [x] Automatic access-token refresh
- [x] Email login and registration
- [x] Onboarding interest selection
- [x] Today screen
- [x] Habit/task quick completion
- [x] Quick creation for basic daily habits and one-time tasks
- [x] Manual sleep start/wake
- [x] Yesterday vs today summary
- [x] Village Seed reflection screen
- [x] Daily / weekly / monthly Journey screen
- [x] Profile and sign-out
- [x] Android Metro production export validation

## Next slices before calling Phase 1 product-complete

- [ ] Client-side Google Sign-In configuration and UI
- [ ] Full habit editor: selected weekdays, measurable units, archive/edit
- [ ] Full task editor: description, life area, due date, priority
- [ ] Habit history and GitHub-style heatmap
- [ ] Sleep history UI and bedtime/wake consistency visuals
- [ ] SQLite cache and offline mutation queue
- [ ] Firebase Cloud Messaging with notification budgets
- [ ] Accessibility pass and large-text validation
- [ ] E2E tests on Android emulator/device
- [ ] PostgreSQL integration test in CI
- [ ] Production deployment configuration

## Validation completed in this handoff

- Django system check: pass
- Backend automated tests: 7/7 pass
- Python compile check: pass
- TypeScript `tsc --noEmit`: pass
- Expo SDK dependency compatibility check: pass using local SDK map
- Android Metro export: pass (892 modules)

## Known toolchain note

`npm audit` currently reports moderate-severity advisories inside the Expo CLI/toolchain dependency tree. There are no high or critical findings in this install, and npm proposes an unsafe major downgrade rather than a non-breaking remediation. Do not run `npm audit fix --force` blindly; reassess these advisories as Expo publishes patched dependency releases.
