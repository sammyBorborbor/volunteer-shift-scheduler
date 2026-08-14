# Testing — Volunteer Shift Scheduler

Covers CONTEXT.md's Phase 4 testing plan (Unit / Functional / Integration / UAT / Security), documented as each case was actually run, not written up after the fact from memory. Format per CONTEXT.md: **Test case → Expected result → Actual result → Pass/Fail**.

**Methodology note:** functional, integration, UAT, and security cases were run against the live Supabase project (`loelmcsadwuzeogcjgea`), not a mock — this project has no local Supabase stack, and RLS/trigger/RPC behavior is exactly what a mock would hide (see CLAUDE.md). Test accounts and test data were created for each case and cleaned up afterward; the two seeded accounts in the Deployment section are the only data left in the database. Unit tests are the one category that's automated and repeatable (`npm run test`); everything else was verified live via direct API calls (`curl`) and a real browser (Playwright), then reproduced here as a record — running it again would require redoing the same manual steps, which is itself logged as technical debt below.

---

## Unit tests (automated — `npm run test`)

49 tests across 2 files, all passing as of 2026-08-14 (grew from the original 29 as the Should-have features below were built TDD — failing test first, then implementation, per CLAUDE.md's testing policy).

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

### `src/lib/shiftDisplay.test.ts` (35 tests)

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
| Signup progress (FR-11): 0 confirmed of 10 | `warning` / "0/10 signed up" | Matched | Pass |
| Signup progress: under half full (4/10) | `warning` / "4/10 signed up" | Matched | Pass |
| Signup progress: exactly half full (5/10) | `success` / "5/10 signed up" (boundary, not flagged) | Matched | Pass |
| Signup progress: more than half full (6/10) | `success` / "6/10 signed up" | Matched | Pass |
| Signup progress: full shift (10/10) | `success` / "10/10 signed up" | Matched | Pass |
| Signup progress: capacity-of-one, no signups | `warning` / "0/1 signed up" | Matched | Pass |
| isUpcoming: future date | `true` | Matched | Pass |
| isUpcoming: today | `true` (today counts as upcoming) | Matched | Pass |
| isUpcoming: past date | `false` | Matched | Pass |
| Signup history status (FR-09): confirmed | Same as attendance status — `neutral` / "Awaiting attendance" | Matched | Pass |
| Signup history status: completed | Same as attendance status — `success` / "Completed" | Matched | Pass |
| Signup history status: no_show | Same as attendance status — `destructive` / "No-show" | Matched | Pass |
| Signup history status: cancelled (self-cancelled) | `neutral` / "Cancelled" | Matched | Pass |
| Signup history status: cancelled (coordinator cancelled the shift, FR-10) | `neutral` / "Shift cancelled" — distinct label | Matched | Pass |
| Signup history status: shift-cancelled flag ignored for non-cancelled statuses | "Completed", not "Shift cancelled" | Matched | Pass |
| Shift editability (FR-10): upcoming, not cancelled | `canEdit`/`canCancel` both `true`, no reason | Matched | Pass |
| Shift editability: shift happening today | `canEdit`/`canCancel` both `true` | Matched | Pass |
| Shift editability: already cancelled | Both `false`, reason "This shift has been cancelled." | Matched | Pass |
| Shift editability: already happened (past date) | Both `false`, reason "Past shifts can't be edited or cancelled." | Matched | Pass |
| Shift editability: cancelled *and* past | Cancelled reason wins over past-shift reason | Matched | Pass |

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
| Coordinator dashboard shows under-capacity signal (FR-11) | Shift under 50% filled shows a warning-tone "X/Y signed up" badge; at/above 50% shows success tone | Created two live shifts (1/4 confirmed = 25%, 1/2 confirmed = 50%); dashboard rendered "1/4 signed up" in warning tone and "1/2 signed up" in success tone, matching the tested boundary exactly | Pass |
| Volunteer views their own shift history (FR-09, `/app/my-signups`) | Every shift the volunteer has ever signed up for, split into Upcoming/Past sections, including cancelled and past-attendance outcomes | Seeded confirmed (upcoming), completed (past-dated via direct SQL, since the UI can't create a past shift), and cancelled signups; page correctly grouped 4 into Upcoming and 1 into Past, with "Awaiting attendance," "Completed," and "Cancelled" badges respectively | Pass |
| Coordinator edits an existing shift's details (FR-10) | Form pre-fills with current values; saving updates the row and reflects immediately on the dashboard | Edited a shift's capacity from 5 to 4 via `/coordinator/shifts/:id/edit`; redirected to dashboard, capacity badge updated to "1/4 signed up" | Pass |
| Coordinator attempts to lower a shift's capacity below its confirmed-signup count | Rejected with a clear error, not a silent failure or a negative-capacity state | Direct SQL `update` attempting to set `capacity=0` on a shift with 1 confirmed signup was rejected by a DB trigger: `"Capacity can't be lower than the 1 volunteer(s) already signed up"` | Pass |
| Coordinator cancels a shift (FR-10) | Shift soft-deleted (`cancelled_at` set), every `confirmed` signup on it cascades to `cancelled`, shift disappears from both the coordinator dashboard and volunteer browse list | Clicked "Cancel this shift" on the roster page (with a confirm dialog first) on a shift with 1 confirmed signup; roster immediately showed "This shift was cancelled" and the volunteer dropped off the "Awaiting attendance" list; confirmed via DB that `cancelled_at` was set and the signup flipped to `cancelled` | Pass |
| Cancelled shift still visible via its own roster URL and in an affected volunteer's history | Not silently deleted — audit trail preserved | Roster page for the cancelled shift still loaded correctly showing "This shift was cancelled"; the volunteer's `/app/my-signups` showed it under Upcoming with a distinct "Shift cancelled" badge (not the generic "Cancelled" used for self-cancellation) | Pass |

**Bug found and fixed during functional testing:** `sign_up_for_shift` only ever did a plain `INSERT`, and `signups` has a `unique (shift_id, volunteer_id)` constraint — so cancelling and signing up again for the same shift (an entirely ordinary flow) hit a raw Postgres constraint-violation error instead of succeeding. Fixed in `supabase/migrations/0009_allow_resignup_after_cancel.sql`: an existing `cancelled` row is now updated back to `confirmed`; any other existing status is rejected up front with a clear message. Retested after the fix — see row above.

**Design constraint discovered while building FR-10 (cancel shift):** the original plan considered a hard `DELETE` on `shifts` for "cancel." Tried it directly against a shift with an existing signup and got a `23503` foreign-key violation (`signups.shift_id` has no `ON DELETE CASCADE`) — confirmed live before writing any cancel code, not assumed. This is why cancel is a soft-delete (`shifts.cancelled_at`) instead: it also preserves the roster/audit trail, matching how `signups.status = 'cancelled'` already works.

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
| `get_upcoming_shifts_with_capacity` excludes cancelled shifts (FR-10) | A shift with `cancelled_at` set no longer appears in either the coordinator dashboard or volunteer browse list | Cancelled a live shift via the RPC; confirmed it disappeared from both `/coordinator` and `/app` on refetch, while remaining reachable at its own roster URL | Pass |
| Cancel cascade is enforced at the DB level regardless of write path (see Security tests — authorization-bypass fix) | Setting `shifts.cancelled_at` directly (bypassing `cancel_shift` entirely) still cascades confirmed signups to `cancelled` | Direct SQL `update shifts set cancelled_at = now()` on a shift with a confirmed signup — signup flipped to `cancelled` automatically, with no RPC call involved | Pass (after fix, `0011`) |

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
11. Open "My Sign-ups" (FR-09) → every shift ever signed up for, split into Upcoming/Past, including a completed past shift and a cancelled one with the correct badge on each.
12. A shift the volunteer was signed up for gets cancelled by the coordinator → it disappears from the browse list on `/app`, and "My Sign-ups" now shows it with a distinct "Shift cancelled" badge (not the same label as cancelling it themselves).

### As a coordinator
1. Sign in with the seeded coordinator account → redirected to `/coordinator`, distinct nav (`Create Shift`, no volunteer-only links).
2. Create a shift with invalid data (empty form) → inline validation on every required field, no submission.
3. Create a valid shift → success screen, "Create another" / "Back to dashboard."
4. See the new shift on the dashboard with a live "X/Y signed up" fill-rate badge (FR-11) — warning tone below 50% filled, success tone at/above.
5. Click "View roster" → shift details, capacity summary, "Awaiting attendance" section.
6. Mark a volunteer completed, then another no-show → sections regroup correctly, badges match.
7. Correct a no-show to completed → confirmed working, no separate "undo" needed.
8. Click "Edit" on a shift (FR-10) → form pre-fills with current values; change capacity and save → redirected to dashboard, badge reflects the new value.
9. From the roster page, click "Cancel this shift" (FR-10) → confirm dialog, then "This shift was cancelled" banner; the shift drops off the dashboard entirely.
10. Attempt direct navigation to `/app` while signed in as coordinator → redirected to own home (`/coordinator`).
11. Sign out → redirected to `/signin` (not `/`), matching the reactive route guard rather than a hardcoded redirect.

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
| `security definer` functions (`sign_up_for_shift`, `get_upcoming_shifts_with_capacity`, `cancel_shift`) checked via Supabase security advisor after every migration that touched them | No unexpected `anon` exposure | Advisor confirmed `anon` execute revoked on all three; the one remaining advisory (`authenticated` can call them) is intentional — that's how volunteers/coordinators are meant to use them | Pass |
| Coordinator bypasses `cancel_shift` entirely by writing `shifts.cancelled_at` directly (e.g. a raw `PATCH /rest/v1/shifts`) | Should still cascade every confirmed signup to `cancelled` — the RPC's role check isn't the only thing standing between a client and the raw table | **Failed initially**: `shifts_write_coordinator` has no column restriction and no explicit `with check`, so a direct write set `cancelled_at` while leaving confirmed signups untouched — an orphaned "confirmed" commitment on a shift the app already treated as cancelled. Caught by a background security review, then reproduced live with a direct SQL update before fixing. Fixed in `supabase/migrations/0011_cascade_cancel_via_trigger.sql` by moving the cascade into an `after update on shifts` trigger, so it fires regardless of write path; `cancel_shift`'s only remaining job is the coordinator-only role check. Retested the same direct-write bypass after the fix — signup cascaded correctly with no RPC involved | Pass (after fix) |

**Known, accepted advisory (not fixed):** "Leaked password protection disabled" — a Supabase Auth dashboard setting (checks new passwords against HaveIBeenPwned), not reachable through the tools used to build this project. Logged in the technical debt log.
