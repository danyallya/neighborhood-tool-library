# Active task

**ID:** TOOL-LENDING-001  
**Title:** Create an item listing and reservable loan lifecycle.

## Context

The technical shell exists; the product workflow does not. Build the first safe, end-to-end domain slice for Neighborhood Tool Library.

## Acceptance criteria

- Type the loans domain record, validation rules and lifecycle.
- Add a create/review flow that works without a server round-trip.
- Persist a draft with Dexie and show saved, unsaved and sync state truthfully.
- Test valid/invalid input, date/order boundaries and serialization.
- Document retention, deletion and limitations of the offline slice.
- Respect this guardrail: Define ownership, deposit, damage and identity rules before exchanges.

## Status

In progress. The local listing and reservation-planning slice is implemented: records are validated, stored in Dexie, shown with their local status, and can be deleted. A planned reservation is only a private marker on this device. This task does not record a real borrower, owner, handover, return, deposit, damage or condition. Do not add real exchange stages until the ownership, deposit, damage and identity rules are defined and reviewed.

TOOL-LENDING-002's validation, empty, error and deletion states are included in the same vertical slice. Next: TOOL-LENDING-003 PostgreSQL migrations and repository tests, still without real-person or exchange data.
