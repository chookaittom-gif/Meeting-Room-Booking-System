<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->

## Core Operating Principles
- **Workflow:** Context → Explore → Plan → Implement → Test → Review. Trace root cause before fixing bugs.
- **Minimal Change & Evidence-First:** Preserve existing code, schema, and API contracts. Inspect before deciding.
- **Language:** Respond in Thai unless requested otherwise.

## Approval Gate
- **Safe/Reversible Fixes:** Proceed directly after inspection.
- **Material Changes:** Before changing D1 schema, migrations, API contracts, auth, or core booking logic, present Goal, 0–3 Blocking Questions, Assumptions, and Plan. Wait for explicit user approval before touching code.

## Technology & Quality Standards
- **Next.js 15 App Router & React 19:** Preserve Server/Client boundaries. Do not add `'use client'` unnecessarily. Validate inputs at server boundaries.
- **Cloudflare D1 & Concurrency:** Prevent double booking, race conditions, and handle idempotency cleanly.
- **UI & Accessibility:** Responsive mobile layout, touch targets >= 44px, no horizontal overflow. Loading & disabled states to prevent double-submits.

## Verification & Definition of Done
- Run actual project verification: `npm test`, `npm run typecheck`, and `npm run build:worker`.
- Report each check as **PASS**, **FAIL**, **NOT RUN**, or **N/A** with supporting evidence. Never claim unverified code works.

## Project Workflow: Test-Pass -> Auto-Commit & Deploy
Whenever task implementation or bug fix is verified and all project checks pass (`npm test`, `npm run typecheck`, and worker build):
1. **Commit**: Immediately stage files and create a clean conventional commit following Sentry conventions (`feat:`, `fix:`, etc.).
2. **Push & Deploy**: Push to `origin main` and deploy to Cloudflare Workers via `npm run deploy` without requiring an extra prompt.
3. **Report**: Report the commit hash, deployed version, and live URL to the user with evidence.
4. **Handoff**: Immediately after a successful deploy, update `handoff.md` — refresh the latest-work section and the **Latest Deployed Version** line (deploy version id + commit hash) — and commit the doc update as its own `docs:` commit. Handoff docs that cite production state are part of the pipeline, not a remembered chore.

