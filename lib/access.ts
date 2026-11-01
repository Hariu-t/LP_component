import { supabase } from '@/lib/supabase';

export const DENIED_MESSAGE = '招待されていないアカウントです';

export function getAllowedEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowedEmails().includes(email.trim().toLowerCase());
}

export async function isEmailAllowed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  if (isBootstrapAdminEmail(normalized)) {
    return true;
  }

  const { data, error } = await supabase.rpc('is_invited_email', {
    check_email: normalized,
  });

  if (error) {
    console.error('is_invited_email failed', error);
    return false;
  }

  return Boolean(data);
}

/** Promote bootstrap allowlist users to admin on first allowed login. */
export async function ensureBootstrapAdmin(
  userId: string,
  email: string | null | undefined
): Promise<void> {
  if (!isBootstrapAdminEmail(email)) return;

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)
    .neq('role', 'admin');

  if (error) {
    console.error('Failed to promote bootstrap admin', error);
  }
}
