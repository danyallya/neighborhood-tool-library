# Neighborhood Tool Library

A local-first planning list for a shared tool library.

Create a private tool draft, mark a reservation as planned and delete local records. Real exchanges are not supported yet.

> Status: local planning prototype. It does not confirm ownership, reservations between people, or real exchanges. No account, sync or server persistence is implemented.

## Start locally

- Node.js 24 LTS and Docker Desktop with Compose.
- Copy .env.example to .env and set a development password.
- Install with `npm ci`.
- Start with docker compose up --build.
- App: http://localhost:3108 · PostgreSQL: localhost:5548

For lower-bandwidth installs, use [Offline Dev Vault](https://github.com/danyallya/offline-dev-vault); see docs/DEPENDENCIES.md.

## Foundation

Next.js App Router, TypeScript, React, Tailwind CSS, React Icons, PostgreSQL, Docker Compose, PWA manifest, conservative offline shell, Dexie local planning drafts, health endpoint, unit tests and CI. English interface.

The service worker caches only the public shell and versioned static files. It does not cache API responses or private data. Tool drafts are stored in browser IndexedDB on the current device and are not encrypted, backed up or synchronized. Do not enter personal or sensitive data.

Read AGENTS.md, TASK.md and docs/PROGRESS.md before work.
