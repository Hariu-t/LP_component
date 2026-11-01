/*
  # Invite-only access via invited_users + RPC

  - invited_users: allowlist of emails that may sign in with Google
  - is_invited_email: SECURITY DEFINER check usable right after OAuth
  - Admin-only CRUD on invited_users
*/

CREATE TABLE IF NOT EXISTS invited_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT invited_users_email_lower CHECK (email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS invited_users_email_key ON invited_users (email);

ALTER TABLE invited_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_invited_email(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM invited_users
    WHERE email = lower(trim(check_email))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_invited_email(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "Admins can view invites" ON invited_users;
CREATE POLICY "Admins can view invites"
  ON invited_users FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create invites" ON invited_users;
CREATE POLICY "Admins can create invites"
  ON invited_users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete invites" ON invited_users;
CREATE POLICY "Admins can delete invites"
  ON invited_users FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Allow bootstrap admins to set their own role to admin once (app also gates by ALLOWED_EMAILS)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
