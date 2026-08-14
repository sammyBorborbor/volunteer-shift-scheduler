# Technical Debt — Volunteer Shift Scheduler

Every row below is a real item encountered during this build, logged as it was found (in `CONTEXT.md`, the project's working handoff document) — not reconstructed after the fact. Format: **Debt → Cause → Impact → Priority → Resolution**, per the assignment brief.

## Debt register

| Debt | Cause | Impact | Priority | Proposed resolution |
|---|---|---|---|---|
| No waitlist / auto-promotion (FR-12) | Cut to Could-have to protect the Must-have time budget | Coordinator manually handles overflow when a shift is full | Medium | Add a `waitlist` table + a trigger on `signups` that promotes the earliest waitlisted volunteer when a confirmed row cancels, v2 |
| No email/SMS notifications | Explicitly out of scope (Won't-have) from the outset | Volunteers must recheck the app manually for updates | Low | Integrate a transactional email/SMS provider (e.g. Resend) via a Supabase Edge Function, future |
| Coordinator has no view of their own cancelled shifts | Cancelling a shift filters `cancelled_at is null` out of the shared shifts-with-capacity query, which both the coordinator dashboard and volunteer browse list read from | A coordinator can't see a list of shifts they've cancelled — only reachable if they still have the roster URL, or via an affected volunteer's own history | Low | Add a "Cancelled" section to the coordinator dashboard reading shifts directly where `cancelled_at is not null` |
| Single-organization assumption | Simplified architecture, matching the stated scope (SRS 1.2) | Cannot support multiple organizations without a schema/RLS migration | Low | Add an `organization_id` column and rework every RLS policy to scope by org, v2 |
| `profiles.phone` readable by any authenticated user, not just coordinators | The broad read policy needed for rosters to show volunteer names was applied to the whole `profiles` row, including phone | A volunteer can read every other volunteer's phone number, not just the names needed for rosters | Medium | Split into a public-safe view (`id`, `full_name`) for general use; restrict `phone` to the row owner and coordinators |
| Leaked-password protection disabled (Supabase Auth) | Dashboard-only setting, not reachable through the automated tooling used to build this project | New passwords aren't checked against known-breach lists | Low | A 30-second toggle in the Supabase dashboard for anyone with access |
| No automated integration/E2E/security test suite | Every functional, integration, UAT, and security case was verified live against the real deployment during development, not captured as a runnable test file | Re-verifying behavior after a future change means manually redoing the same steps, not `npm test` | Medium | Add Playwright specs for the two full UAT walkthroughs and `pgTAP` specs for the RLS policies and the capacity/overlap RPC logic |
| Concurrent sign-up row lock not load-tested | No tooling available in this build could fire genuinely simultaneous requests | The row lock that prevents overbooking under concurrent sign-ups should serialize correctly per standard Postgres semantics, but this was verified by code inspection only | Low | A small k6/Artillery script hitting the sign-up endpoint concurrently would produce real evidence instead of a code-review argument |
| Coordinator accounts require manual database intervention to create | Deliberate — there is no self-service coordinator sign-up path, because that path is exactly the privilege-escalation hole this build closed | Onboarding a new coordinator needs direct database access | Low | An admin-invite flow (a coordinator-only "Invite coordinator" action using the Supabase Admin API), v2 |
| No pagination on shift/roster lists | Not needed at the data volumes a single organization is expected to produce | Would degrade with a large shift history or a very large roster | Low | Add cursor pagination if data volume grows |

## Classification

The brief asks for each item to be classified as **acceptable temporarily**, **scheduled for future resolution**, or **critical and requiring immediate attention**. None of the ten items above fall into the last category — and that's a specific, checked claim, not an assumption: every issue that reached *critical* severity during this build was found and fixed before deployment, not logged as debt and deferred. Two concrete examples:

- A security review during implementation found that the original RLS policies allowed a volunteer to self-escalate their own role to coordinator, and to mark their own attendance. Both were fixed immediately (RLS policy rework + a role-change-blocking trigger) before any further feature work continued.
- A later security review found that cancelling a shift could be bypassed via a direct database write that skipped the cascade responsible for updating affected volunteers' sign-up records. This was reproduced live, then fixed by moving the cascade into a database trigger so it's enforced regardless of write path, and re-verified live before being considered closed.

With that category empty by design, the remaining ten items split as follows:

**Scheduled for future resolution** (has a concrete next step, worth doing before the next real deployment cycle):

- `profiles.phone` over-exposure — the one item here that's a genuine data-privacy issue rather than a missing feature, and the highest-priority item to actually schedule.
- No waitlist (FR-12)
- No automated integration/E2E/security test suite
- Coordinator has no view of their own cancelled shifts

**Acceptable temporarily** (a deliberate scope boundary for this build, not something actively wrong):

- No email/SMS notifications (explicitly Won't-have)
- Single-organization assumption (matches the stated scope)
- Leaked-password protection disabled (a dashboard toggle, not a code issue)
- Concurrent sign-up row lock not load-tested (correct by inspection; load testing would confirm, not fix, anything)
- Coordinator accounts require manual creation (deliberate, closes a real privilege-escalation path)
- No pagination (not needed at current or expected near-term data volumes)

A fuller repayment plan — priority ordering and what each fix actually requires architecturally — is in `MAINTENANCE.md`, Part B.
