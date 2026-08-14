# Testing — Volunteer Shift Scheduler

Covers CONTEXT.md's Phase 4 testing plan (Unit / Functional / Integration / UAT / Security), documented as each case was actually run, not written up after the fact from memory. Format per CONTEXT.md: **Test case → Expected result → Actual result → Pass/Fail**.

**Methodology note:** functional, integration, UAT, and security cases were run against the live Supabase project (`loelmcsadwuzeogcjgea`), not a mock — this project has no local Supabase stack, and RLS/trigger/RPC behavior is exactly what a mock would hide (see CLAUDE.md). Test accounts and test data were created for each case and cleaned up afterward; the two seeded accounts in the Deployment section are the only data left in the database. Unit tests are the one category that's automated and repeatable (`npm run test`); everything else was verified live via direct API calls (`curl`) and a real browser (Playwright), then reproduced here as a record — running it again would require redoing the same manual steps, which is itself logged as technical debt below.

---

## Unit tests (automated — `npm run test`)

29 tests across 2 files, all passing as of 2026-08-14.

### `src/lib/shiftValidation.test.ts` (14 tests)

| Test case | Expected result | Actual result | Pass/Fail |
|---|---|---|---|
| Valid shift input | No validation errors | No errors | Pass |
| Empty title | Title error | Title error | Pass |
| Whitespace-only title | Title error | Title error | Pass |
| Date in the past | Date error | Date error | Pass |
| Date is today | No date error (today is allowed) | No error | Pass |
| Missing date | Date error | Date error | Pass |
| Start time equals end time | End-time error | End-time error | Pass |
| Start time after end time | End-time error | End-time error | Pass |
| Start time before end time | No end-time error | No error | Pass |
| Capacity of zero | Capacity error | Capacity error | Pass |
| Negative capacity | Capacity error | Capacity error | Pass |
| Non-numeric capacity | Capacity error | Capacity error | Pass |
| Non-integer capacity (e.g. 3.5) | Capacity error | Capacity error | Pass |
| Valid positive integer capacity | No capacity error | No error | Pass |

### `src/lib/shiftDisplay.test.ts` (15 tests)

| Test case | Expected result | Actual result | Pass/Fail |
|---|---|---|---|
| Capacity status: 0 remaining | `neutral` / "Full" | Matched | Pass |
| Capacity status: negative remaining | `neutral` / "Full" | Matched | Pass |
| Capacity status: 1 remaining | `warning` / "1 spot left" (singular) | Matched | Pass |
| Capacity status: 2 remaining | `warning` / "2 spots left" (plural) | Matched | Pass |
| Capacity status: 10 remaining | `success` / "10 spots left" | Matched | Pass |
| Capacity status: low/plenty boundary (2 vs 3) | `warning` then `success` | Matched | Pass |
| Shift action state: open (spots remain, no relationship) | `open` | Matched | Pass |
| Shift action state: full (no spots, no relationship) | `full` | Matched | Pass |
| Shift action state: confirmed (any spots left) | `confirmed` | Matched | Pass |
| Shift action state: confirmed wins over full (took last spot) | `confirmed`, not `full` | Matched | Pass |
| Shift action state: completed (even if shift still upcoming) | `completed` | Matched | Pass |
| Shift action state: no_show | `no_show` | Matched | Pass |
| Attendance status: confirmed | `neutral` / "Awaiting attendance" | Matched | Pass |
| Attendance status: completed | `success` / "Completed" | Matched | Pass |
| Attendance status: no_show | `destructive` / "No-show" | Matched | Pass |

---

## Functional tests

| Test case | Expected result | Actual result | Pass/Fail |
|---|---|---|---|
| Volunteer signs up for an open shift | RPC succeeds, badge flips to "Signed up," capacity count decreases | Confirmed live: badge updated, remaining capacity dropped by 1, row created with `status='confirmed'` | Pass |
| Sign-up rejected at capacity | RPC raises `"Shift is at capacity"` | Direct RPC call against a full shift returned exactly that message, `400` | Pass |
| Sign-up rejected on schedule overlap | RPC raises `"Schedule conflict with an existing shift"` | Confirmed both via UI (inline error under the button) and direct RPC call against two same-day overlapping shifts | Pass |
| Cancel sign-up | Row's status becomes `cancelled` (not deleted); capacity restored | Confirmed via DB check after clicking Cancel: `status='cancelled'`, capacity badge reverted to original count | Pass |
| Re-sign-up after cancelling the same shift | Succeeds, same row flips back to `confirmed` | **First attempt failed** with a raw `23505 duplicate key` error (bug — see below); fixed in migration `0009`; re-tested and confirmed success | Pass (after fix) |
| Sign-up attempted while already confirmed | Rejected with `"You have already signed up for this shift"` | Matched, `400`, before capacity/overlap checks even ran | Pass |
| Invalid shift creation rejected | Coordinator form shows inline errors, no insert | Submitted the Create Shift form empty: all 4 required fields (title, date, start time, end time, capacity) showed inline errors, no network request fired | Pass |
| Coordinator marks a volunteer completed | Row status → `completed`, moves to "Recorded" section | Confirmed live: badge changed, row moved sections, "Mark completed" button disabled on that row | Pass |
| Coordinator marks a volunteer no-show | Row status → `no_show` | Confirmed live: destructive-tone badge, correct button disabled | Pass |
| Coordinator corrects a recorded attendance mark | Status flips between `completed` ↔ `no_show` | Clicked "Mark completed" on a `no_show` row; badge and button-disabled state updated correctly | Pass |

**Bug found and fixed during functional testing:** `sign_up_for_shift` only ever did a plain `INSERT`, and `signups` has a `unique (shift_id, volunteer_id)` constraint — so cancelling and signing up again for the same shift (an entirely ordinary flow) hit a raw Postgres constraint-violation error instead of succeeding. Fixed in `supabase/migrations/0009_allow_resignup_after_cancel.sql`: an existing `cancelled` row is now updated back to `confirmed`; any other existing status is rejected up front with a clear message. Retested after the fix — see row above.

---

## Integration tests

All run against the live Supabase project (Postgres 17, `eu-west-1`), not a mock.

| Test case | Expected result | Actual result | Pass/Fail |
|---|---|---|---|
| `get_upcoming_shifts_with_capacity` aggregates across *all* volunteers, not just the caller | Remaining-capacity count reflects everyone's confirmed signups | Inserted a confirmed signup from a volunteer with no RLS visibility to the caller; the caller's displayed remaining count dropped accordingly | Pass |
| Roster query joins `signups` → `profiles` correctly | Coordinator sees volunteer names/phone via one query, no N+1 | Confirmed via PostgREST embedded-resource select; roster rendered names and phone (when present) correctly | Pass |
| `sign_up_for_shift` row-locks the shift during capacity/overlap checks | Concurrent sign-ups for the same shift can't both pass capacity | Verified via code review of the `for update` row lock added in the earlier security pass (`0004`) — a genuine concurrency test would need two simultaneous requests, which wasn't reproduced live in this pass | Pass (by inspection; not load-tested) |
| Coordinator account seeding (no self-service signup path exists) | New coordinator created via direct `auth.users`/`auth.identities` insert + a role promotion that requires disabling/re-enabling `profiles_prevent_role_change` | Both seeded accounts (see Deployment section) created this way; login confirmed via password grant | Pass |
| Production build reflects the deployed Supabase project correctly | Live app talks to the same project as local dev | Signed in on the production URL with the seeded coordinator account; shift list, roster, and attendance marking all worked identically to local | Pass |
| Vercel routing serves client-side routes correctly | Direct navigation/refresh on any route works, not just `/` | **Failed initially**: `/signin`, `/app`, `/coordinator` all returned `404` on direct navigation (missing SPA rewrite). Fixed by adding `vercel.json`; retested all three routes after redeploy — all correctly load or redirect to `/signin` | Pass (after fix) |

---

## UAT — full walkthrough

### As a volunteer
1. Land on `/` → hero, benefits, verified photo render correctly.
2. Sign up with a new account → Supabase requires email confirmation on this project, so the "check your email" state renders (rather than an immediate redirect) → confirmed via direct API test with a synthetic-but-valid email address.
3. Sign in → redirected to `/app`, "Upcoming shifts" list loads.
4. See a shift with plenty of capacity → "N spots left" (green), a shift with few spots → "N spot(s) left" (amber), a full shift → "Full" (grey), no button.
5. Sign up for an open shift → button replaced by "Signed up" badge + "Cancel sign-up."
6. Attempt to sign up for a second, overlapping shift → clear inline rejection, no state change.
7. Cancel the sign-up → reverts to "Sign up" button, capacity restored.
8. Sign up again for the same shift → succeeds (previously broken, now fixed — see Functional section).
9. After a coordinator marks attendance on a shift the volunteer attended → badge shows "Attended," no button (previously this incorrectly showed "Sign up" again — now fixed).
10. Attempt direct navigation to `/coordinator` → redirected to own home (`/app`), not an error page.

### As a coordinator
1. Sign in with the seeded coordinator account → redirected to `/coordinator`, distinct nav (`Create Shift`, no volunteer-only links).
2. Create a shift with invalid data (empty form) → inline validation on every required field, no submission.
3. Create a valid shift → success screen, "Create another" / "Back to dashboard."
4. See the new shift on the dashboard with a live capacity badge.
5. Click "View roster" → shift details, capacity summary, "Awaiting attendance" section.
6. Mark a volunteer completed, then another no-show → sections regroup correctly, badges match.
7. Correct a no-show to completed → confirmed working, no separate "undo" needed.
8. Attempt direct navigation to `/app` while signed in as coordinator → redirected to own home (`/coordinator`).
9. Sign out → redirected to `/signin` (not `/`), matching the reactive route guard rather than a hardcoded redirect.

---

## Security tests

| Test case | Expected result | Actual result | Pass/Fail |
|---|---|---|---|
| Volunteer attempts to `INSERT` directly into `shifts` | `403`, RLS violation | Matched: `new row violates row-level security policy for table "shifts"` | Pass |
| Volunteer attempts to update `profiles.role` (self-escalation to coordinator) | Blocked — even a direct SQL `UPDATE` is blocked by trigger, not just RLS | `BEFORE UPDATE` trigger raised `"role cannot be changed directly"`; tested directly in SQL (not just via the app) | Pass |
| Volunteer attempts to set their own `signups.status` to `completed` (self-mark attendance) | `403`, RLS violation | Matched, on both an already-cancelled row (RLS `USING` clause excludes it — 0 rows affected) and a fresh `confirmed` row (explicit `403`) | Pass |
| Volunteer attempts to **read** another volunteer's signup row (by known ID, and by broad shift query) | Empty result, not the other row — RLS filters silently | Both queries returned `[]` with `200`; confirmed via privileged query that the row genuinely existed and was simply filtered out by RLS, not missing | Pass |
| Coordinator reads the same signup row | Full visibility | Returned the complete row | Pass |
| Anonymous (unauthenticated) request to `sign_up_for_shift` | `401`, permission denied | Matched: `permission denied for function sign_up_for_shift` | Pass |
| Anonymous request to `get_upcoming_shifts_with_capacity` | `401`, permission denied | Matched | Pass |
| Volunteer attempts direct navigation to a coordinator-only route (`/coordinator`, `/coordinator/*`) | Client-side redirect to own home — a UX guard, not the real boundary | Matched; underlying RLS is the actual enforcement, confirmed separately above | Pass |
| `security definer` functions (`sign_up_for_shift`, `get_upcoming_shifts_with_capacity`) checked via Supabase security advisor after every migration that touched them | No unexpected `anon` exposure | Advisor confirmed `anon` execute revoked on both; the one remaining advisory (`authenticated` can call them) is intentional — that's how volunteers are meant to use them | Pass |

**Known, accepted advisory (not fixed):** "Leaked password protection disabled" — a Supabase Auth dashboard setting (checks new passwords against HaveIBeenPwned), not reachable through the tools used to build this project. Logged in the technical debt log.
