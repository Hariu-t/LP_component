/*
  # Auth profile bootstrap + public LP read policies

  - Auto-create profiles row when a user signs up
  - Allow anon to read published pages and related sections/components
*/

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'editor'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Allow authenticated users to insert their own profile (fallback)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Public read for published landing pages
DROP POLICY IF EXISTS "Anon can view published pages" ON pages;
CREATE POLICY "Anon can view published pages"
  ON pages FOR SELECT
  TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS "Anon can view sections of published pages" ON page_sections;
CREATE POLICY "Anon can view sections of published pages"
  ON page_sections FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_sections.page_id
        AND pages.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Anon can view components for public pages" ON components;
CREATE POLICY "Anon can view components for public pages"
  ON components FOR SELECT
  TO anon
  USING (true);
