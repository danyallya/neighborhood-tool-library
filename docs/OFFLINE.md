# Offline behavior

The PWA stores the public entry page, offline notice, icon and versioned static assets after the first visit. It never caches API responses. Tool planning drafts are stored in IndexedDB by Dexie on the current browser profile; they survive page reloads but are not encrypted, backed up, synced or shared. Other users of the same browser profile may see them. The UI can delete a saved draft from this local object store; device backups, browser recovery and secure erasure are not covered.

The existing outbox has no product synchronization behavior. There is no conflict resolution, cross-device recovery or retry workflow. Reservation state is only a local planning marker; no real loan handover or return is recorded.
