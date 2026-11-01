/*
  # Assets storage bucket + anon access (auth-disabled mode)

  - Creates a public `assets` storage bucket used by the dashboard uploader
  - Allows anon/authenticated read/write on storage objects in that bucket
  - Allows anon CRUD on the `assets` table while authentication is disabled
*/

-- Public storage bucket for uploaded media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for the assets bucket
DROP POLICY IF EXISTS "Public can view asset files" ON storage.objects;
CREATE POLICY "Public can view asset files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Public can upload asset files" ON storage.objects;
CREATE POLICY "Public can upload asset files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "Public can update asset files" ON storage.objects;
CREATE POLICY "Public can update asset files"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'assets')
  WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "Public can delete asset files" ON storage.objects;
CREATE POLICY "Public can delete asset files"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'assets');

-- Table policies for auth-disabled dashboard usage
DROP POLICY IF EXISTS "Anon can view assets" ON assets;
CREATE POLICY "Anon can view assets"
  ON assets FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can upload assets" ON assets;
CREATE POLICY "Anon can upload assets"
  ON assets FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can delete assets" ON assets;
CREATE POLICY "Anon can delete assets"
  ON assets FOR DELETE
  TO anon
  USING (true);

-- Relax authenticated insert so uploaded_by may be null during transitional auth
DROP POLICY IF EXISTS "Users can upload assets" ON assets;
CREATE POLICY "Users can upload assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by IS NULL OR auth.uid() = uploaded_by);
