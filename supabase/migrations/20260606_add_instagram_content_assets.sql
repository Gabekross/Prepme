-- Marketing Hub: add Instagram as a supported generated content asset channel

ALTER TABLE content_assets
  DROP CONSTRAINT IF EXISTS content_assets_channel_check;

ALTER TABLE content_assets
  ADD CONSTRAINT content_assets_channel_check
  CHECK (channel IN ('master_article', 'blog', 'threads', 'linkedin', 'x', 'facebook', 'instagram', 'newsletter'));
