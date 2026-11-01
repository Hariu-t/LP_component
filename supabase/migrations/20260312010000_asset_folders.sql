/*
  # Asset folder management

  - asset_folders: nested folders via parent_id
  - assets.folder_id: nullable FK (NULL = root)
  - RLS for anon/authenticated (auth-disabled dashboard mode)
*/

CREATE TABLE IF NOT EXISTS asset_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES asset_folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_folders_parent_id ON asset_folders(parent_id);

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES asset_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_folder_id ON assets(folder_id);

ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can view asset folders" ON asset_folders;
CREATE POLICY "Anon can view asset folders"
  ON asset_folders FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can create asset folders" ON asset_folders;
CREATE POLICY "Anon can create asset folders"
  ON asset_folders FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update asset folders" ON asset_folders;
CREATE POLICY "Anon can update asset folders"
  ON asset_folders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can delete asset folders" ON asset_folders;
CREATE POLICY "Anon can delete asset folders"
  ON asset_folders FOR DELETE
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated can view asset folders" ON asset_folders;
CREATE POLICY "Authenticated can view asset folders"
  ON asset_folders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can create asset folders" ON asset_folders;
CREATE POLICY "Authenticated can create asset folders"
  ON asset_folders FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update asset folders" ON asset_folders;
CREATE POLICY "Authenticated can update asset folders"
  ON asset_folders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete asset folders" ON asset_folders;
CREATE POLICY "Authenticated can delete asset folders"
  ON asset_folders FOR DELETE
  TO authenticated
  USING (true);

-- Allow anon to update assets (folder moves)
DROP POLICY IF EXISTS "Anon can update assets" ON assets;
CREATE POLICY "Anon can update assets"
  ON assets FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update assets" ON assets;
CREATE POLICY "Authenticated can update assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
