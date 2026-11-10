# Progress log

## 2026-10-27 — foundation

**Done:** localized Next/TypeScript/Tailwind/React Icons/PostgreSQL/Docker/PWA shell, Dexie/outbox starter, health route, metadata test, CI, product brief, task/backlog and operations/security notes.

**Not done:** product workflow, auth, domain tables, sync, release security review, provider, dependency install and lockfile.

**Next:** Create an item listing and reservable loan lifecycle.

**Delivery:** Public repository created and foundation pushed to main. The latest handoff is committed locally; push it when the cache/Docker blocker is cleared.

## 2026-10-28 — local planning slice

**Done:** Added a typed local tool draft with name/category/quantity and optional planned return date; strict date, quantity and name validation; chronological listed/reserved/retired transitions; Dexie v2 storage that preserves the existing outbox; truthful local-save and not-synced states; empty/error/deletion UI; and offline/security documentation. Reservation is a personal planning marker only. No identity, ownership, deposit, damage, condition, handover or return data is collected. Added an npm lockfile and moved Vitest to the existing Dependabot target 5.0.5 to address its reported advisory.

**Verification:** `npm ci --prefer-offline --audit=false --registry=http://localhost:4873/` installed 403 packages. `npm run verify` passed typecheck, 8 tests, lint (0 errors; one existing PostCSS config warning) and production build. `npm audit --registry=http://localhost:4873/` found 0 vulnerabilities. `docker compose config --quiet` and `docker compose build app` passed after changing the BuildKit network to host and pointing it at `host.docker.internal:4873`; the image installed 412 packages, reported 0 vulnerabilities and built successfully. `docker compose up -d --no-build` reached healthy app and database containers; `/` returned 200 and `/api/health` returned `{"ok":true,"database":"ready"}`. `docker compose down` stopped both services and preserved `neighborhood-tool-library_postgres_data`; an ignored local `.env` keeps the development volume reusable.

**Next:** PostgreSQL migrations and repository tests. Define the ownership, deposit, damage and identity rules before designing real exchanges. Review open Dependabot and preparation PRs; lockfile now allows the skipped CI jobs to run.


## Environment check — 2026-10-27

**Update:** Compose now passes PostgreSQL host, database, user and password as separate environment fields so local password characters do not break a connection URL. docker compose config --quiet passes for all 30 projects; runtime verification is pending Docker access.

Docker service com.docker.service is stopped; Start-Service cannot open it with current permissions. The npm cache registry at localhost:4873 is unavailable. Offline lockfile generation returned ETARGET for eslint-config-next@16.4.3 from the host cache. No dependency install, tests or production build ran; CI reports a warning and skips dependency installation, tests, lint and build until a lockfile is committed.
