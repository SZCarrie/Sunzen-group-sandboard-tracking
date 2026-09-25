import { createClient } from "@supabase/supabase-js";

// Service-role client for admin-only operations (e.g. setting a user's password
// directly). Never import this into client components — the key must stay server-side.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
