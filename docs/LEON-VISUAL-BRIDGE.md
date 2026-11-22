# Leon Visual Bridge

Secure server-side binary transport for approved WebP assets.

## Flow

1. The assistant prepares and optimizes an image.
2. A trusted server creates a cryptographically random, one-use upload ticket and stores only its SHA-256 hash in `private.visual_upload_tickets`.
3. The binary WebP is POSTed directly to the `leon-visual-bridge` Edge Function. No base64 expansion or browser admin panel is required.
4. The function validates the WebP signature, enforces the 8 MiB limit, checks the optional SHA-256 header, atomically consumes the ticket, uploads to the public `visual-assets` bucket, and inserts the public catalog record.
5. The function rolls back the object if catalog registration fails.

## Security properties

- Upload tickets expire and are single-use; only their hashes are stored.
- The ticket is scoped to one asset key, title, and exact object path.
- The service-role key remains server-side in Supabase Edge Function secrets.
- Public clients can read only catalog rows marked published; they cannot create or edit records.
- Uploads are WebP-only, capped at 8 MiB, and never overwrite an existing object.
- A failed catalog insert triggers object cleanup.

## Supabase objects

The initial project bootstrap created:

- `private.visual_upload_tickets` (not exposed to client roles)
- `public.visual_asset_catalog` (RLS enabled; published rows are read-only to clients)
- `public.consume_visual_upload_ticket(text)` (EXECUTE granted only to service_role)
- Edge Function `leon-visual-bridge` (JWT verification disabled because it uses a high-entropy, short-lived, one-use bearer ticket)

The ticket issuer must run only in a trusted server-side environment using service_role. Never put service_role or an unexpired ticket in frontend code, source control, or public logs.

## Endpoint

`POST /functions/v1/leon-visual-bridge`

Headers:

- `Authorization: Bearer <one-use-ticket>`
- `Content-Type: image/webp`
- `X-Content-SHA256: <hex-sha256>` (recommended)

Body: raw WebP bytes, not JSON and not base64.

A successful response returns `asset_key`, `public_url`, byte count, SHA-256 and dimensions.

## Operational note

The Edge Function is deployed as version 2 in the Model-Panstwa Supabase project. The source in this folder is the versioned source of truth. A separate trusted ticket-issuer / ChatGPT file-byte handoff is still required to mint a ticket and stream the generated file to this endpoint; the current ChatGPT connector set does not expose a general-purpose outbound binary upload call. Do not claim an asset is published until the endpoint returns HTTP 201 and the public URL is verified.
