/*
  # Initial Schema for Component-Based LP Platform

  ## Overview
  This migration creates the foundational database structure for a component-based landing page builder platform.

  ## Tables Created

  1. **components**
     - `id` (uuid, primary key) - Unique component identifier
     - `name` (text) - Display name of the component
     - `description` (text) - Component description
     - `html_template` (text) - HTML/JSX template code
     - `css_template` (text) - CSS/Tailwind classes
     - `schema_json` (jsonb) - Props definition (editable fields)
     - `thumbnail_url` (text) - Preview image
     - `category` (text) - Component category (hero, cta, form, etc.)
     - `usage_count` (integer) - Number of times used
     - `created_by` (uuid) - User who created it
     - `created_at` (timestamptz) - Creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  2. **pages**
     - `id` (uuid, primary key) - Unique page identifier
     - `slug` (text, unique) - URL path
     - `title` (text) - Page title
     - `description` (text) - Meta description
     - `status` (text) - draft/preview/published
     - `parent_id` (uuid) - Parent page for hierarchy
     - `meta_tags` (jsonb) - SEO meta tags
     - `custom_css` (text) - Page-specific CSS
     - `created_by` (uuid) - Page creator
     - `published_at` (timestamptz) - Publication timestamp
     - `created_at` (timestamptz) - Creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  3. **page_sections**
     - `id` (uuid, primary key) - Unique section identifier
     - `page_id` (uuid) - Reference to pages table
     - `component_id` (uuid) - Reference to components table
     - `content_json` (jsonb) - Component props/content
     - `order` (integer) - Display order on page
     - `is_visible` (boolean) - Visibility toggle
     - `created_at` (timestamptz) - Creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  4. **assets**
     - `id` (uuid, primary key) - Unique asset identifier
     - `url` (text) - Storage URL
     - `file_name` (text) - Original filename
     - `file_type` (text) - MIME type
     - `file_size` (bigint) - Size in bytes
     - `alt_text` (text) - Image alt text
     - `width` (integer) - Image width
     - `height` (integer) - Image height
     - `uploaded_by` (uuid) - User who uploaded
     - `created_at` (timestamptz) - Upload timestamp

  5. **profiles**
     - `id` (uuid, primary key) - References auth.users
     - `email` (text) - User email
     - `full_name` (text) - User full name
     - `avatar_url` (text) - Profile picture
     - `role` (text) - User role (admin, editor, viewer)
     - `created_at` (timestamptz) - Account creation
     - `updated_at` (timestamptz) - Last update

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to authenticated users
  - Users can only modify their own content or based on role
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  role text DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create components table
CREATE TABLE IF NOT EXISTS components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  html_template text NOT NULL,
  css_template text DEFAULT '',
  schema_json jsonb DEFAULT '[]'::jsonb,
  thumbnail_url text,
  category text DEFAULT 'general',
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'published')),
  parent_id uuid REFERENCES pages(id) ON DELETE SET NULL,
  meta_tags jsonb DEFAULT '{}'::jsonb,
  custom_css text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create page_sections table
CREATE TABLE IF NOT EXISTS page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  content_json jsonb DEFAULT '{}'::jsonb,
  "order" integer NOT NULL DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint DEFAULT 0,
  alt_text text DEFAULT '',
  width integer,
  height integer,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_created_by ON components(created_by);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_page_id ON page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_component_id ON page_sections(component_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_order ON page_sections(page_id, "order");
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON assets(uploaded_by);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Components policies
CREATE POLICY "Users can view all components"
  ON components FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create components"
  ON components FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own components"
  ON components FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own components"
  ON components FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Pages policies
CREATE POLICY "Users can view all pages"
  ON pages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can delete own pages"
  ON pages FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Page sections policies
CREATE POLICY "Users can view all page sections"
  ON page_sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create page sections"
  ON page_sections FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM pages WHERE id = page_id AND (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Users can update page sections"
  ON page_sections FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM pages WHERE id = page_id AND (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM pages WHERE id = page_id AND (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Users can delete page sections"
  ON page_sections FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM pages WHERE id = page_id AND (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  ));

-- Assets policies
CREATE POLICY "Users can view all assets"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON page_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update component usage count
CREATE OR REPLACE FUNCTION update_component_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE components SET usage_count = usage_count + 1 WHERE id = NEW.component_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE components SET usage_count = usage_count - 1 WHERE id = OLD.component_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.component_id != NEW.component_id THEN
    UPDATE components SET usage_count = usage_count - 1 WHERE id = OLD.component_id;
    UPDATE components SET usage_count = usage_count + 1 WHERE id = NEW.component_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for component usage tracking
CREATE TRIGGER track_component_usage
  AFTER INSERT OR UPDATE OR DELETE ON page_sections
  FOR EACH ROW EXECUTE FUNCTION update_component_usage_count();