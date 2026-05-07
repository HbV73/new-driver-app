# Phase 4D Offline Media Queue

## Scope

The offline sync foundation can now persist proof-of-collection media evidence before proof records are synced.

Supported in this phase:

- Proof signature data URLs
- Proof photo data URLs

Not wired yet:

- Expense receipts
- Odometer/fuel photos
- Damage report photos
- Backup request media
- Delivery signature records outside proof-of-collection

## Flow

1. `submitProofOfCollection()` keeps its current online behavior.
2. When proof submission is queued, signature/photo data URLs are converted to `Blob`s and stored in the offline media store.
3. The queued proof mutation stores media IDs instead of depending only on in-memory data URLs.
4. During sync, the engine uploads media records first to Supabase Storage.
5. The returned storage paths are attached to the proof payload.
6. The proof row is inserted only after media upload succeeds.

## Current Limitations

The media queue stores blobs in IndexedDB. A later Android-hardening phase should copy native camera file URIs into Capacitor Filesystem app storage and store durable file paths, especially for large images or long offline periods.
