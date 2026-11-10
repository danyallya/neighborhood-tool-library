# Architecture

- Web: Next.js App Router and server-only route handlers.
- UI: React, Tailwind CSS, React Icons, semantic HTML and explicit status.
- Offline: service worker caches only the public shell; Dexie v2 keeps local `loanDrafts` alongside the existing outbox table.
- Database: PostgreSQL 18 in Compose; ordered SQL migrations under db/migrations.
- Domain belongs in src/domain; server access in src/server; view code in app.
- External providers use server-side adapters and environment-only secrets.
- Docker multi-stage build; isolated web/database services per project.

First product record: a local planning-only loan record, validated in `src/domain/tool-loan.ts` and saved from the client to IndexedDB. There is no API write or PostgreSQL mapping yet. The listed/reserved/retired states do not claim a real-world exchange. Define ownership, deposit, damage and identity rules before adding handover or return records.
