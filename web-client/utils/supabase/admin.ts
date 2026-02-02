import { createClient } from "@supabase/supabase-js";

/**
 * Admin client that bypasses Row Level Security (RLS).
 *
 * ⚠️ WARNING: Use ONLY for:
 * - Backend API routes (e.g., FastAPI engine)
 * - Admin-only server actions
 * - Operations that require elevated privileges
 *
 * DO NOT use in regular Server Components or Client Components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
