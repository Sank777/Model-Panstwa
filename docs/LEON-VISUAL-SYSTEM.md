# Leon Visual System (LVS)

Status: architecture and first validation layer under implementation. This document does not claim that ChatGPT-to-Gateway binary handoff is already available.

## Design principles

1. One canonical object per visual asset in Supabase Storage; pages reference it by immutable asset ID and version.
2. GitHub stores application code, schemas, manifests, deployment configuration and audit evidence—not duplicate canonical image binaries.
3. A generated image is never uploaded or published until the owner explicitly accepts it.
4. Upload, approval, page assignment and publication are separate state transitions.
5. Every transition is auditable and reversible. Existing assets are never overwritten.
6. The pipeline fails closed: any missing check prevents publication.
7. The public site receives only published assets through stable, cacheable URLs/CDN.

## Target architecture

- Creative layer: ChatGPT ImageGen generates a candidate; the owner accepts or rejects it.
- Transport layer: a trusted ChatGPT file-capable action streams raw bytes to the Gateway. Base64 pasted into source or chat is not an acceptable production transport.
- Gateway: validates the one-use upload ticket, byte count, RIFF/WebP container, size, digest and metadata; stores the immutable object.
- Catalog: `public.visual_asset_catalog` stores identity, version, storage path, dimensions, hash, status and metadata. The current catalog is the first implementation; the older `visual_assets` table is pillar-specific and must not be repurposed for cross-site assets.
- Delivery: Supabase Storage/CDN serves only published immutable objects.
- Integration: a placement manifest maps asset IDs to page slots. The renderer or build step resolves the published URL.
- CI/CD: validates manifest references, tests affected pages, deploys only after checks and performs a live URL smoke test.
- Audit: records actor, timestamp, source, hash, old/new state, deployment commit and rollback reference.

## Asset lifecycle

`generated -> accepted -> upload-ticket-issued -> uploaded(draft) -> validated -> assigned -> deployment-tested -> published -> archived`

A rejection moves the candidate to `rejected`; it never mutates an existing published version. The Gateway only creates a draft catalog row. Publication must be a distinct trusted operation after owner approval and successful page checks.

## Naming and storage

- Stable ID: `VIS-000001` (monotonic or UUID-backed; never reused).
- Immutable storage path: `library/<asset-id>/v<version>/<sha256>.webp`.
- Do not overwrite a path. A changed image gets a new version and object key.
- Keep original generated source separately where retention policy permits; never serve originals by default.
- Generate responsive derivatives only when they improve measured delivery; record each derivative under the same asset/version.
- Use WebP by default; AVIF may be added after compatibility checks.

## Manifest

`assets/visual-library/manifest.json` is the checked-in deployment projection, not the canonical binary store. It contains only assets approved for live use and their page placements. The JSON Schema is in `manifest.schema.json`; the Node validator enforces referential integrity and safe paths.

## Security model

- Ticket values are high entropy, short-lived, one-use; only SHA-256 hashes are stored.
- The service-role key is server-only and never appears in the browser, Git, logs or ChatGPT prompt.
- The Gateway enforces strict content length, 8 MiB maximum, WebP container signature/length and SHA-256.
- Upload paths and asset IDs are server-generated; callers cannot choose arbitrary storage paths.
- Uploads are non-overwriting and idempotency is keyed by asset/version/hash.
- Public read access is limited to published catalog records and public objects; client writes are denied.
- Rate limits and audit logs apply to ticket issuance and uploads.
- CI credentials use least privilege; workflow permissions are read-only unless a dedicated deployment job requires a narrowly scoped write token.
- A rollback changes the page placement to the prior known-good immutable asset; it does not delete history.

## Current implementation notes

- Supabase project already contains `private.visual_upload_tickets`, `public.visual_asset_catalog`, RPC `consume_visual_upload_ticket(text)` and Edge Function `leon-visual-bridge`.
- The current Edge Function receives raw WebP bytes, but a trusted ticket issuer and ChatGPT file-byte handoff are still missing.
- The older `visual_assets` workflow syncs pillar-scoped assets into the Git repository every 15 minutes. It is a legacy path and is not the target canonical storage design. Do not silently repurpose it or break its consumers during migration.
- The current bridge is being hardened to create `draft` records only. A separate publish transition remains required.
- Supabase's advisor reports RLS disabled on `private.visual_upload_tickets`. Because this is a security-sensitive policy change, it is intentionally not altered in this change set. Review the advisor and explicitly approve the remediation plan before changing it. The private schema's API exposure and service-role-only grants must be verified alongside RLS.

## Delivery plan

### Phase 1 — transport and safe intake
- Resolve the ChatGPT file-byte handoff using a supported file-capable connector/action; no manual base64 transfer.
- Build an authenticated ticket issuer in a trusted server environment.
- Test valid upload, expired/reused ticket, wrong digest, truncated RIFF, wrong MIME, oversize body and storage collision.
- Keep uploaded objects in draft state.

### Phase 2 — canonical catalog and manifest
- Finalize asset/version schema and unique storage keys.
- Validate manifest JSON Schema and references in CI.
- Add audit events and lifecycle constraints.
- Add a public catalog read API/view exposing only published records.

### Phase 3 — page integration
- Add named slots to pages without touching unrelated content.
- Resolve IDs to CDN URLs, use alt text, dimensions, responsive sizes and correct loading priority.
- Migrate page by page; never perform a bulk rewrite.

### Phase 4 — deployment and rollback
- Run HTML/link/image checks, responsive smoke tests and regression checks.
- Deploy behind a protected branch/approval gate.
- Verify the live page and asset URL; record commit and evidence.
- Roll back automatically on failed smoke tests.

### Phase 5 — audit and expansion
- Review access controls, RLS, storage policies, logs, cache headers, dependency versions and costs.
- Migrate remaining visual modules only after the pilot passes.
- Add SVG/icons/diagrams as separate validated media types, not by weakening image validation.

## Acceptance criteria

The system is not complete until a user can accept one generated image and, without downloading or copying files manually, see it in the correct live page after automated checks. The pipeline must prove the uploaded SHA-256, immutable storage path, catalog state, placement, deployment commit and live URL. A failed stage must leave the existing page unchanged.
