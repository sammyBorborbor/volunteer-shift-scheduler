# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An exam project (CSCD602 Advanced Software Engineering, University of Ghana) — a volunteer shift-scheduling app under a strict 48-hour build window. Live at **https://volunteer-shift-scheduler.vercel.app/** (auto-deploys from `main` via Vercel). **Read `CONTEXT.md` first, always** — it is the authoritative handoff brief: functional/non-functional requirements (MoSCoW-prioritized), the full DB schema + RLS policies, the 9-step implementation order with its time budget, and explicit scope boundaries (what's Won't-have and must not be built even if easy). Treat scope discipline as a hard constraint, not a suggestion.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc -b`) then production build; treat as the primary correctness gate, since there is no test runner configured yet
- `npm run lint` — oxlint (config: `.oxlintrc.json`)
- `npm run preview` — preview the production build locally

## Testing

Follow **test-driven development** for new functionality: write a failing test first, implement the minimum needed to pass it, then refactor. This supersedes CONTEXT.md's original plan of a separate Phase 4 testing pass after implementation — write tests as you build, not after.

No test runner is configured yet. Set one up (Vitest is the natural fit for this Vite + React stack) the first time a test is actually needed, rather than installing test infrastructure speculatively. CONTEXT.md's Phase 4 test-case list (unit/functional/integration/UAT/security) is still the reference for *what* to cover — TDD changes *when* those tests get written, not what they need to check.

## Git commits

This is an individually graded exam submission — no collaboration is permitted. Do **not** add a `Co-Authored-By: Claude` (or any AI-attribution) trailer to commit messages. Keep messages standard and concise (short imperative summary line; body only if it adds real context).

## Architecture

**Stack:** React 19 + Vite + TypeScript + Tailwind CSS v4, backed entirely by Supabase (Postgres + Auth + RLS) — there is no hand-built API layer. All data access goes through `supabase-js` directly from components/hooks, authorized by RLS policies, not application code.

**Folder layout** (feature-area organization per CONTEXT.md's NFR-06):
- `src/components/` — shared UI primitives (`Button`, `Card`, `StatusPill`, `Layout`, `FormField`)
- `src/pages/` — route-level views, one per use case (`Landing`, `SignUp`, `SignIn`, `AppHome`)
- `src/hooks/` — data/auth hooks (`useAuth`)
- `src/lib/supabaseClient.ts` — the single Supabase client instance

**Supabase wiring (`src/lib/supabaseClient.ts`):** exports `supabase` and `isSupabaseConfigured`. It deliberately never throws on missing env vars — a prior version did, which crashed the entire React tree before anything rendered (a blank page with only a console error). Any code path that touches Supabase should check `isSupabaseConfigured` and degrade to a visible status/error state, never let a missing-config error take down the whole app (NFR-04: no silent failures).

**Env vars:** must be prefixed `VITE_` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) for Vite to expose them to the client. CONTEXT.md's own `.env.local` example omits the prefix — don't copy that naming literally.

**Database (`supabase/migrations/`):** sequentially numbered SQL files, applied directly against the live Supabase project via the Supabase MCP tools (`mcp__claude_ai_Supabase__*`) rather than the CLI. `0001_init.sql` is schema + RLS + the `sign_up_for_shift` RPC verbatim from CONTEXT.md; `0002`/`0003` harden that RPC (pinned `search_path`, revoked `anon` execution). **Supabase auto-grants `EXECUTE` on new `public`-schema functions to `anon` and `authenticated` by default** — a `SECURITY DEFINER` function is silently callable by anyone unless you explicitly `revoke ... from anon`. Run `get_advisors` (security) after any migration that adds a function; don't assume the SQL in CONTEXT.md is complete as written.

**Design tokens (`src/index.css`):** Tailwind v4 `@theme` block, semantic (not literal) color names — `ink`/`ink-foreground`, `accent`/`accent-foreground`, `surface`/`surface-elevated`, `muted`, `border`, plus `success`/`warning`/`destructive`/`neutral` pairs (each a light background + a matching darker text color, tuned for ≥4.5:1 contrast — don't pair an accent background with white text without checking contrast first, e.g. white-on-`accent` is ~1.7:1). Single font family (Inter) throughout — intentional for this app-UI/product register, not an oversight.
