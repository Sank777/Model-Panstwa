# Leon — central visual library

Only assets with status `published` in Supabase are synchronized here. Drafts and approved-but-not-published files are never downloaded.

- Source of truth and approval states: Supabase `public.visual_assets`.
- Private source images: `visual-drafts`.
- Public published copies: `visual-assets`.
- Repository mirror: `assets/visual-library/pillar-N/`.
- Sync cadence: GitHub Actions every 15 minutes, plus manual workflow dispatch.
- Integrity: WebP signature, 8 MB ceiling, registry byte size and SHA-256 are checked before a file is committed.
- Stable mapping: `.github/visual-library-sync.json` prevents duplicate commits and repairs missing local copies.

Publishing an image in the admin panel places it in the central public library. It does **not** silently replace an existing website image. A separate manifest change is required to attach a library asset to a page; the existing manifest builder and CI checks remain authoritative.
