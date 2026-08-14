# System Analysis & Implementation

## System Analysis

Before implementation, the actors and use cases from the SRS (Part 1, Sections 2 and 6) were translated into concrete business rules and a data model — the analysis step between "what the system must do" and "how it's built."

**Core entities and their relationships** (full attribute detail in the SRS, Section 5, and the ER diagram): `profiles` extends Supabase's built-in `auth.users` with a `role` (`volunteer` or `coordinator`) and contact details; `shifts` represents a bookable unit of volunteer work with a date, time range, and capacity, created by a coordinator; `signups` links a volunteer to a shift and carries a status that changes over its lifetime (`confirmed` → `completed`/`no_show`, or `confirmed` → `cancelled`). The `signups.status` lifecycle is itself a business rule, not just a column: a volunteer can only move their own row `confirmed → cancelled`; only a coordinator can move a row to `completed`/`no_show`; and a shift being cancelled by a coordinator cascades every `confirmed` row on it to `cancelled` automatically, rather than leaving it stale.

**Business rules identified during analysis, each mapped to where it's enforced:**

- **Capacity rule** — a shift cannot accept a sign-up once `confirmed` sign-ups equal its capacity. Enforced in the database (not the client), inside the same transaction as the sign-up itself, to close the race where two people click "Sign up" on the last spot at the same moment.
- **No schedule overlap rule** — a volunteer cannot hold two `confirmed` sign-ups for shifts that overlap in time on the same day. Enforced the same way, in the same transaction, for the same reason.
- **Role-based access rule** — a volunteer and a coordinator see and can do materially different things, and that boundary has to hold even against a client that doesn't cooperate (a raw API call, not just the UI). Enforced via Postgres Row-Level Security policies, evaluated on every query regardless of which client makes it.
- **Audit-trail rule** — cancelling a sign-up or a shift never deletes the row; it flips a status/timestamp instead, so a coordinator's roster and a volunteer's own history stay accurate after the fact.

This analysis — rules first, enforcement location decided per rule, before writing UI code — is what shaped the implementation order below: the database and its rules were built and verified before the interface that calls them.

## Implementation

### Build order

Implementation proceeded in the order the SRS's use cases naturally depend on each other, each step built and manually verified before the next began:

1. **Project scaffolding** — Vite + React 19 + TypeScript + Tailwind CSS v4, Supabase project provisioned, base design tokens established.
2. **Volunteer registration and login** — Supabase Auth (email/password), a `profiles` row auto-created via an `auth.users` trigger (there is no client-facing insert path into `profiles`, closing off a class of bugs where a user could exist without a matching profile).
3. **Coordinator login and shift creation** — role-based routing (a signed-in user with the wrong role is redirected to their own home, not shown an error), the shift-creation form with client-side validation backed by database constraints.
4. **Volunteer shift browsing** — a `security definer` database function that computes remaining capacity across *all* volunteers, because Row-Level Security intentionally only lets a volunteer see their own sign-up rows — a plain client-side count would have silently undercounted everyone else's.
5. **Volunteer sign-up** — the atomic capacity/overlap-checked RPC described above, row-locking the target shift so concurrent sign-ups serialize correctly.
6. **Volunteer cancel sign-up** — a direct, narrowly-scoped RLS policy permitting a volunteer to flip only their own, currently-`confirmed` row to `cancelled`.
7. **Coordinator roster view** — reusing the coordinator's already-broad RLS read access to `signups`.
8. **Coordinator mark attendance** — a direct update gated by a coordinator-only RLS policy, with both "mark completed" and "mark no-show" always available so a mistaken mark can be corrected without a separate undo control.
9. **Should-have features** (attempted only after every Must-have was complete and verified, per the effort estimation's scope-gating decision): a volunteer's full personal shift history, coordinator shift editing and cancellation, and a coordinator-facing signal for under-subscribed shifts.

### Key implementation decisions

**Row-Level Security is the actual security boundary, not the UI.** Every meaningful access-control rule in this system — who can read a row, who can write it, and under what prior state — is expressed as a Postgres RLS policy, not as a client-side `if`. This was verified directly: a volunteer's raw `POST` to the shifts table is rejected by Postgres with a `403` independent of anything the React app does, because the UI simply never renders a path to attempt it — the enforcement doesn't depend on the UI cooperating.

**Supabase auto-grants execute permission on new functions by default.** Every database function used by this app that runs with elevated privilege (`security definer`) needed an explicit `revoke ... from anon` after creation, because Supabase's default behavior is to grant `EXECUTE` to `anon` and `authenticated` automatically — a function written to be coordinator-only or authenticated-only is silently public otherwise. This was checked with Supabase's own security advisor after every migration that added a function, not assumed correct from the SQL alone.

**Soft-delete, not hard-delete, for anything with a dependent record.** Cancelling a sign-up sets a status rather than deleting the row; cancelling a shift sets a timestamp rather than deleting the shift. This wasn't an arbitrary style choice — a hard delete of a shift with an existing sign-up was tried directly against the live database during the Should-have build and failed with a foreign-key violation, confirming live (not assumed) that the schema doesn't support it, and that preserving the record is the right behavior anyway for an audit trail a coordinator might need later.

**Verification happened against the real deployed database, not a mock.** This project has no local Supabase stack. Row-Level Security policies, database triggers, and stored procedures are exactly the kind of behavior a mock would hide or misrepresent, so every functional, integration, and security claim in the Testing report (Part on Testing) was checked by actually calling the live API or driving the real browser against the live deployment, then written up as a record — not inferred from code review alone.

**A background security review caught a real gap after initial shipping**, not during initial development: the coordinator shift-cancellation feature's cascade (updating every affected volunteer's sign-up) was only enforced inside one code path (an RPC), while a more direct database write could bypass it. This was reproduced live, fixed by moving the enforcement into a database trigger so it applies regardless of write path, and re-verified live before being closed — documented in full in the Technical Debt section and the Testing report's security tests.
