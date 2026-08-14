# Volunteer Shift Scheduler — Build Context

Individual project-based examination build. CSCD602 Advanced Software Engineering,
University of Ghana. This file is the handoff brief for implementation — the planning
and design work is already done (see `/docs` for the full write-ups); this session's
job is to build, test, and deploy the actual application.

## Exam constraints (keep these in view while building)

- 48-hour window total, not just coding time. Budget: 4h planning (done), 4h design
  (done), **18h implementation (this is now)**, 6h testing, 4h deployment, 12h final docs.
- Individual work. No collaboration, no shared code/SRS/design with other students.
- Must be a functional, deployed application — not a mockup or static site.
- The exam rewards disciplined scope more than feature count. Do not build past the
  Must-have list below without checking in first.

## Problem statement

Community organizations coordinating volunteers (NGOs, food banks, event drives)
struggle with manual coordination — spreadsheets and chat groups make it hard to see
who's signed up, when a shift is full, or where coverage gaps exist. This app lets
volunteers browse and sign up for shifts with enforced capacity, and lets a
coordinator manage the roster and attendance.

## Actors

- **Volunteer** — browses shifts, signs up (subject to capacity + no schedule
  overlap), cancels own sign-ups, views own shift history.
- **Coordinator** — creates shifts, views roster per shift, marks attendance.

## Functional requirements (MoSCoW)

Only build **Must** first. Attempt **Should** only if the 18h budget isn't exceeded.
**Could** items are documented as future work, not built. **Won't** items are out of
scope entirely — do not add them even if they seem easy.

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Volunteer can register and log in | Must |
| FR-02 | Coordinator can log in with a distinct role | Must |
| FR-03 | Coordinator can create a shift (title, date, start/end time, capacity, location) | Must |
| FR-04 | Volunteer can view upcoming shifts with remaining capacity | Must |
| FR-05 | Volunteer can sign up for a shift; rejected if at capacity or overlaps an existing sign-up | Must |
| FR-06 | Volunteer can cancel their own sign-up | Must |
| FR-07 | Coordinator can view the roster for a given shift | Must |
| FR-08 | Coordinator can mark a volunteer's attendance (completed / no-show) | Must |
| FR-09 | Volunteer can view a personal list of past and upcoming shifts | Should |
| FR-10 | Coordinator can edit or cancel an existing shift | Should |
| FR-11 | Coordinator's view highlights under-capacity shifts | Should |
| FR-12 | Waitlist with auto-promotion when a confirmed sign-up cancels | Could |
| FR-13 | Volunteers can filter shifts by date range | Could |

**Explicitly out of scope (Won't):** email/SMS notifications, multi-organization
support, recurring shift templates, volunteer-hour certificates/exports.

## Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Usability | Responsive on mobile and desktop |
| NFR-02 | Security | Role-based access enforced at the database level (RLS), not just in the client |
| NFR-03 | Validation | No past dates, start < end time, capacity > 0 — client- and server-side |
| NFR-04 | Reliability | API/DB errors caught and shown with a clear message, never a silent failure |
| NFR-05 | Performance | Shift/roster views load within 2s at expected single-org data volumes |
| NFR-06 | Maintainability | Code organized by feature area |

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Row-Level Security) — no hand-built API layer
- **Hosting:** Vercel (auto-deploy from GitHub on push to `main`)
- **Auth:** Supabase Auth, email/password

Full justification for each choice is in `docs/Architecture_Tech_Stack_...docx`.

## Suggested project structure

```
volunteer-shift-scheduler/
├── src/
│   ├── components/       # shared UI (ShiftCard, RosterTable, etc.)
│   ├── pages/             # route-level views (per use case)
│   ├── lib/
│   │   └── supabaseClient.ts
│   ├── hooks/              # useAuth, useShifts, useSignups, etc.
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── migrations/
│       └── 0001_init.sql   # schema + RLS from this file
├── .env.local               # SUPABASE_URL / SUPABASE_ANON_KEY — not committed
├── package.json
└── vite.config.ts
```

## Database schema

```sql
create table profiles (
  id uuid references auth.users(id) primary key,
  full_name text not null,
  role text not null check (role in ('volunteer','coordinator')),
  phone text,
  created_at timestamptz default now()
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int not null check (capacity > 0),
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now(),
  check (start_time < end_time)
);

create table signups (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references shifts(id) not null,
  volunteer_id uuid references profiles(id) not null,
  status text not null default 'confirmed'
    check (status in ('confirmed','cancelled','no_show','completed')),
  signed_up_at timestamptz default now(),
  unique (shift_id, volunteer_id)
);
```

## Row-Level Security policies

```sql
alter table profiles enable row level security;
alter table shifts enable row level security;
alter table signups enable row level security;

-- profiles: any authenticated user can read (needed for names on rosters);
-- only the owner can update their own row
create policy "profiles_select_authenticated" on profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_self" on profiles
  for update using (auth.uid() = id);

-- shifts: any authenticated user can read; only coordinators can write
create policy "shifts_select_authenticated" on shifts
  for select using (auth.role() = 'authenticated');
create policy "shifts_write_coordinator" on shifts
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'coordinator')
  );

-- signups: volunteers see/manage their own; coordinators see/manage all
create policy "signups_select_own_or_coordinator" on signups
  for select using (
    volunteer_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'coordinator')
  );
create policy "signups_insert_own" on signups
  for insert with check (volunteer_id = auth.uid());
create policy "signups_update_own_or_coordinator" on signups
  for update using (
    volunteer_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'coordinator')
  );
```

## Sign-up logic — two implementation options

The design diagrams show client-side capacity/overlap checks followed by an insert
(simple, matches `diagrams/sequence_diagram_signup.mmd` exactly). That has a known
race-condition weakness: two volunteers could both pass the capacity check
simultaneously and both get inserted. Two options:

1. **Match the diagram as-is** (client checks, then insert) — faster to build, but
   log the race condition explicitly as a technical debt item (Medium priority,
   "acceptable temporarily" given single-organization low-concurrency use).
2. **Recommended: server-side RPC** — do the whole check-and-insert atomically in
   Postgres, which removes the race condition entirely:

```sql
create or replace function sign_up_for_shift(p_shift_id uuid)
returns signups
language plpgsql
security definer
as $$
declare
  v_shift record;
  v_current_count int;
  v_overlap_count int;
  v_result signups;
begin
  select * into v_shift from shifts where id = p_shift_id;

  select count(*) into v_current_count from signups
    where shift_id = p_shift_id and status = 'confirmed';
  if v_current_count >= v_shift.capacity then
    raise exception 'Shift is at capacity';
  end if;

  select count(*) into v_overlap_count from signups s
    join shifts sh on sh.id = s.shift_id
    where s.volunteer_id = auth.uid()
      and s.status = 'confirmed'
      and sh.date = v_shift.date
      and sh.start_time < v_shift.end_time
      and sh.end_time > v_shift.start_time;
  if v_overlap_count > 0 then
    raise exception 'Schedule conflict with an existing shift';
  end if;

  insert into signups (shift_id, volunteer_id, status)
    values (p_shift_id, auth.uid(), 'confirmed')
    returning * into v_result;
  return v_result;
end;
$$;
```

Pick whichever fits the remaining time budget — either is a defensible engineering
decision if documented.

## Implementation order & time budget (18h total)

Build in this order; each is independently testable before moving on.

| # | Use case | Budget |
|---|---|---|
| 1 | Project scaffolding, Supabase wiring, base styling | 1.5h |
| 2 | Register / Log In (Volunteer) | 1.5h |
| 3 | Log In (Coordinator) | 1.0h |
| 4 | View open shifts (Volunteer) | 1.5h |
| 5 | Create shift (Coordinator) | 2.5h |
| 6 | Sign up for shift — capacity + overlap check | 5.0h |
| 7 | Cancel sign-up | 1.5h |
| 8 | View roster (Coordinator) | 2.0h |
| 9 | Mark attendance (Coordinator) | 1.5h |

Full justification and the Use Case Points calculation behind this budget are in
`docs/Effort_Estimation_...docx`.

## Testing to cover (Phase 4, ~6h)

- Unit: capacity-check logic, overlap-check logic (isolate as pure functions if not
  using the RPC approach)
- Functional: sign-up success; sign-up blocked at capacity; sign-up blocked on
  overlap; cancel sign-up; invalid shift creation rejected
- Integration: full sign-up flow against a real (test) Supabase project
- UAT: full walkthrough as both Volunteer and Coordinator
- Security: confirm RLS blocks a volunteer from reading/writing another volunteer's
  sign-ups, and blocks a volunteer from writing to `shifts`

Document each as: Test case → Expected result → Actual result → Pass/Fail.

## Technical debt log

See `docs/TESTING.md` for the full test evidence behind several of these rows.

| Debt | Cause | Impact | Priority | Resolution |
|---|---|---|---|---|
| No waitlist / auto-promotion (FR-12) | Cut to Could-have for time | Coordinator manually handles overflow | Medium | Add waitlist table + trigger, v2 |
| No email/SMS notifications | Explicitly out of scope (Won't-have) | Volunteers must recheck app manually | Low, acceptable now | Integrate Resend, future |
| No personal shift-history view (FR-09) | Should-have, deprioritized to finish Must-haves + process phases | Volunteers only see upcoming shifts, not a past/upcoming split; "My Sign-ups" nav item is still a placeholder | Medium | Build a dedicated page querying `signups` by `volunteer_id` across all statuses/dates |
| No shift edit/cancel (FR-10) | Should-have, same reason | A coordinator who makes a mistake on a shift (wrong date, wrong capacity) has to live with it or manually fix it in Supabase | Medium | Add an edit form to `CreateShift`-adjacent route; cancelling a shift needs a decision on what happens to existing confirmed signups |
| No under-capacity highlighting (FR-11) | Should-have, same reason | Coordinator has to scan every shift's badge manually rather than the UI surfacing low-signup shifts | Low | Mostly styling — the capacity data already exists via `get_upcoming_shifts_with_capacity` |
| Single-organization assumption | Simplified architecture | Can't support multiple orgs without a migration | Low | Add `organization_id` + multi-tenant RLS, v2 |
| `profiles` phone number readable by any authenticated user, not just coordinators | `profiles_select_authenticated` is verbatim from CONTEXT.md's own spec; not deviated from without checking in first | A volunteer can read every other volunteer's phone number via a broad `select`, not just names needed for rosters | Medium | Split into a public-safe view (id, full_name) for general use, restrict `phone` to the row owner + coordinators |
| Leaked-password protection disabled (Supabase Auth) | Dashboard-only setting (Authentication → Policies), not reachable through the MCP/CLI tools used to build this project | New passwords aren't checked against HaveIBeenPwned | Low | Flip the toggle in the Supabase dashboard — a 30-second manual fix, just needs someone with dashboard access |
| No automated integration/E2E/security test suite | Every functional/integration/UAT/security case in `docs/TESTING.md` was verified live (curl + Playwright) during development, not captured as a runnable test file | Re-verifying after a future change means manually redoing the same steps, not `npm test` | Medium | Add Playwright test specs and/or `pgTAP`/RLS-focused SQL tests for the highest-value flows (sign-up race, RLS boundaries) |
| Concurrent sign-up row lock (`sign_up_for_shift`'s `for update`) not load-tested | No tooling used in this session could fire genuinely simultaneous requests | The row lock *should* serialize concurrent sign-ups per standard Postgres semantics, but this was verified by code inspection, not an actual race | Low | A small k6/Artillery script hitting the RPC concurrently would close this out |
| Coordinator accounts require manual DB intervention to create | Deliberate — no self-service coordinator signup exists (closing that path is what fixed the privilege-escalation hole in `0004`) | Onboarding a new coordinator needs direct SQL access (insert into `auth.users`/`auth.identities`, then disable/re-enable `profiles_prevent_role_change` to promote the role) | Low, acceptable for single-org/exam scope | An admin invite flow, v2 |
| No pagination on shift/roster lists | Not needed at expected single-org data volumes (NFR-05) | Would degrade with a large number of shifts or a very large roster | Low | Add cursor pagination to `useShifts`/`useRoster` if volume grows |

## Deployment checklist

- [x] Push to GitHub, connect repo to Vercel
- [x] Set `SUPABASE_URL` / `SUPABASE_ANON_KEY` as Vercel environment variables — note: must be named `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Vite only exposes `VITE_`-prefixed vars to the client); the names above are what this file originally said, not what Vite requires
- [x] Verify production build end-to-end — caught and fixed a real bug doing this: client-side routes (`/signin`, `/app`, `/coordinator`) 404'd on direct navigation because Vercel's static hosting needs an explicit SPA rewrite (`vercel.json`), which didn't exist until this pass. See `docs/TESTING.md`.
- [x] Seed one test Volunteer account and one test Coordinator account
- [x] Record live URL + credentials in `Deployment_and_Source_Links.txt`

## Documents included in this handoff (`/docs`)

- `SRS_Volunteer_Shift_Scheduler.docx` — full requirements spec
- `Effort_Estimation_Volunteer_Shift_Scheduler.docx` — UCP calculation and time budget
- `Architecture_Tech_Stack_Volunteer_Shift_Scheduler.docx` — architecture and stack justification
- `exam_checklist_tracker.html` — open in a browser; interactive 57-item checklist across all 6 phases, state saves automatically

## Diagrams included (`/diagrams`, Mermaid source)

- `use_case_diagram.mmd`
- `er_diagram.mmd`
- `sequence_diagram_signup.mmd`
- `architecture_diagram.mmd`
