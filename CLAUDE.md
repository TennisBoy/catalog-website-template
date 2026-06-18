# CLAUDE.md: English Department Cataloging Website

## What this project is

A practical inventory / cataloging tool for a high school **English department office** (~3,000 books & materials, many as class sets of 25–60 copies). It must serve as both a **digital catalog** and a **physical organization system** (shelf labels, locations). Users are **non-technical**: a Department Head, a student assistant doing the cataloging, and other teachers who search the catalog later.

Current stage: **design**. The active deliverable is a UI/UX **design spec** at `docs/catalog-website-design-spec.md`, not application code yet.

## My role: team-lead orchestrator

When doing substantive work on this project, act as a **team lead**, not a solo implementer:

- **Plan, then dispatch.** Break work into independent units and delegate to subagents (`Explore` for research, `Plan` for design, build agents for implementation) per the superpowers **subagent-driven-development** and **dispatching-parallel-agents** skills. Run independent agents in parallel.
- **Stay in the loop.** Read each agent's result, verify it, and decide the next step. Don't rubber-stamp.
- **Process skills first.** brainstorming → writing-plans → TDD/implementation, in that order.
- **Verify before claiming done** (superpowers `verification-before-completion`): run/inspect the artifact and cite evidence before saying it works.
- Reserve solo inline work for trivial edits and conversational turns.

## Stack (built)

- **React + Vite + TypeScript** SPA, mobile-first. CSV import/export for backup.
- **Two runtime modes**, chosen at load from `public/config.json`:
  - **Local demo** (no `supabaseUrl`): editable, `localStorage`-backed, for dev/preview.
  - **Cloud** (Supabase configured): shared catalog with **public read, auth-gated write**. Signed-out visitors get a **read-only** site (no Add/Edit/Review/Import; item links open a read-only detail). The Department Head **signs in** (one Supabase account) to edit; changes are live for everyone (realtime refetch).
- `readOnly` is derived from auth state (`cloud && !userEmail`) and gates all write UI across screens. The store API (`useCatalog`) is unchanged for screens; mutations are optimistic + written to Supabase.
- **Hosting:** GitHub Pages via `.github/workflows/deploy.yml` (free, no domain). Vite `base: './'`. Setup steps in `docs/DEPLOY-AND-SETUP.md`; DB schema + RLS in `supabase/schema.sql`.

## Domain model (canonical enums, keep consistent everywhere)

- **Categories (11):** Grade 9, Grade 10, Grade 11, Grade 12, ESL, French, Theory of Knowledge, Board Games, Films, Book Club, Other / Uncategorized.
- **Material types (6):** Book, Dictionary, ESL Material, Board Game, Film, Other.
- **Status (4):** Cataloged, Needs review, Misplaced, Duplicate possible.
- **Condition:** New, Good, Worn, Damaged.
- An **Item** = title + quantity + category + materialType + location (section / shelf) + optional author/isbn/notes/condition + status + timestamps.
- "**Titles**" = count of distinct items; "**copies**" = sum of quantity. Use both terms precisely.

## Design principles (non-negotiable for this audience)

- Practical inventory tool, **not** a corporate database. Minimal clutter.
- **Fast data entry** above all (numeric steppers, tappable category chips, "Save & add another").
- Mobile-friendly, large tap targets, easy search/filter.
- Each **category has a consistent accent color** that ties the digital catalog to the physical shelf labels.
- Built for non-technical teachers: plain language, forgiving UX.

## Seven core screens

Dashboard · Catalog · Add/Edit Item · Shelf View · Label Generator · Review/Cleanup · Export.

## Future (v2): design hooks only, not v1 scope

Photo→OCR title extraction, category suggestion from title/notes, fuzzy duplicate detection, auto cleanup report, QR-code labels.

## Git

This is a **standalone repo** (`git init` inside `catalogEngDep`), independent of the parent home-folder repo at `C:\Users\yinxi`. Keep `node_modules/`, `dist/`, and `.env*` out of version control.

**Auto-commit (user preference):** Commit completed work automatically to the current branch without asking for permission each time. Use clear, scoped commit messages (one logical change per commit). Still do NOT commit secrets, `.env*`, `node_modules/`, `dist/`, large binaries, or the git-ignored `catalog-inbox/` photos. For large/multi-step feature work, branching off `main` first is still fine, but routine small changes may be committed directly to `main`.

**Auto-push (user preference):** Push to the remote at your own discretion; no need to ask each time. Push at sensible checkpoints: when a change is complete and verified (lint/build/typecheck green), so the live Azure site stays current. Avoid pushing work that is half-finished or failing checks. Pushing to `main` triggers an automatic Azure Static Web Apps redeploy.
