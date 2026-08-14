# Limitations, Conclusion & References

## Limitations

Beyond the individually-tracked technical debt (`TECHNICAL_DEBT.md`), the following are structural limitations of this version, most of them deliberate scope boundaries rather than defects:

- **Single organization only.** The schema and every RLS policy assume one organization sharing the same set of shifts; there is no tenant isolation.
- **Same-day shifts only.** The schedule-overlap check compares start/end times within a single calendar date; shifts spanning midnight are out of scope, matching an explicit assumption recorded in the SRS.
- **No automated regression suite beyond unit tests.** Unit tests (49, covering pure display/validation logic) run automatically via `npm run test`. Every RLS, trigger, and RPC behavior — the majority of what actually enforces correctness in this system — was verified live during development and is documented with evidence in the Testing report, but is not captured as a runnable test that would catch a future regression automatically.
- **No offline support.** The application requires a live connection to Supabase for every meaningful action; there is no local caching or offline queueing.
- **No waitlist, notifications, or shift filtering.** All three were explicitly scoped to Could-have/Won't-have and not built — see the SRS's MoSCoW table and `MAINTENANCE.md`'s future-evolution roadmap for what each would require.
- **No pagination.** Shift and roster lists load in full; this is fine at the data volumes a single organization is expected to produce, but would need addressing before onboarding an organization with a long shift history.
- **Coordinator provisioning is manual.** There is no self-service or admin-invite path to create a coordinator account — a deliberate choice, since a self-service path is exactly what would reopen the privilege-escalation vulnerability this build closed, but it does mean onboarding a new coordinator currently requires direct database access.

## Conclusion

This project set out to replace manual, spreadsheet-and-chat volunteer coordination with a small system that enforces its own rules — capacity, schedule conflicts, and role-based access — rather than relying on whoever is watching the spreadsheet to enforce them by hand. That goal was met: every Must-have requirement (FR-01–FR-08) is implemented, deployed, and verified live against a real Supabase-backed production database, and all three Should-have requirements (FR-09–FR-11, plus FR-10's shift edit/cancel) were completed as well, since the Must-have set was finished with time still available in the schedule.

The effort estimation (Part on Software Effort Estimation) surfaced the single most consequential decision of the build before any code was written: a Use Case Points estimate of roughly 900 person-hours against a 48-hour window is not a 10% overrun to manage, it's a ~20x gap that makes "build everything" impossible by construction. Treating that gap as the input to scope — Must-haves only, Should-haves attempted only if time remained, Could-haves documented as future work rather than started — is what made a working, tested, deployed system possible in the time available, rather than a half-finished attempt at a larger one.

The security posture of the system reflects a specific discipline followed throughout: every issue found at genuinely critical severity — a role self-escalation path, a self-attendance-marking hole, a race condition in the capacity check, and later a cascade-bypass in the shift-cancellation feature — was fixed immediately upon discovery, verified live, and documented, rather than logged as debt and deferred. What remains in the technical debt log is, by design, nothing more severe than Medium priority (`TECHNICAL_DEBT.md`), which is itself a claim this document backs with the specific fixes that kept it that way, not an assumption.

## References

Software, libraries, and services used in building and running this system:

- **React** (v19) — UI library. https://react.dev
- **Vite** — build tool and dev server. https://vite.dev
- **TypeScript** — static typing. https://www.typescriptlang.org
- **Tailwind CSS** (v4) — utility-first styling. https://tailwindcss.com
- **React Router** (`react-router-dom`) — client-side routing. https://reactrouter.com
- **Supabase** — managed Postgres, Authentication, Row-Level Security, and auto-generated REST API (`supabase-js` client library). https://supabase.com
- **Vercel** — static hosting and CI/CD, auto-deploying from GitHub. https://vercel.com
- **Vitest** — unit test runner. https://vitest.dev
- **oxlint** — linter. https://oxc.rs
- **GitHub** — source control and repository hosting. https://github.com
- **Inter** (Google Fonts) — primary interface typeface. https://fonts.google.com/specimen/Inter
- **Bricolage Grotesque** (Google Fonts) — display typeface used on the landing page. https://fonts.google.com/specimen/Bricolage+Grotesque
- Photography (Unsplash License — free to use, no attribution legally required, credited here for transparency):
  - Landing page and sign-in/sign-up hero: https://images.unsplash.com/photo-1599059813005-11265ba4b4ce
  - Volunteer dashboard banner: https://images.unsplash.com/photo-1758599668294-8d13c0942601
  - Coordinator dashboard banner: https://images.unsplash.com/photo-1758599668125-e154250f24bd
