ALTER TABLE public.visual_asset_catalog
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.visual_asset_catalog
  DROP CONSTRAINT IF EXISTS visual_asset_catalog_lifecycle_check;

ALTER TABLE public.visual_asset_catalog
  ADD CONSTRAINT visual_asset_catalog_lifecycle_check
  CHECK (
    (status = 'draft' AND bucket = 'visual-drafts' AND published_at IS NULL)
    OR
    (status = 'published' AND bucket = 'visual-assets' AND published_at IS NOT NULL)
    OR
    (status = 'archived')
  );

COMMENT ON CONSTRAINT visual_asset_catalog_lifecycle_check
  ON public.visual_asset_catalog IS
  'Enforces draft uploads in private storage and published records only in the public bucket with publication timestamp.';
