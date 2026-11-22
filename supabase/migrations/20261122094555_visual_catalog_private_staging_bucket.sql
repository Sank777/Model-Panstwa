ALTER TABLE public.visual_asset_catalog
  DROP CONSTRAINT IF EXISTS visual_asset_catalog_bucket_check;

ALTER TABLE public.visual_asset_catalog
  ADD CONSTRAINT visual_asset_catalog_bucket_check
  CHECK (bucket IN ('visual-drafts', 'visual-assets'));

ALTER TABLE public.visual_asset_catalog
  ALTER COLUMN bucket SET DEFAULT 'visual-drafts';

COMMENT ON COLUMN public.visual_asset_catalog.bucket IS
  'visual-drafts until explicit approval/publication; visual-assets only after publication.';
