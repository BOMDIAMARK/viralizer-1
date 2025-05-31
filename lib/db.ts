import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let dbInstance: SupabaseClient | null = null

if (supabaseUrl && supabaseServiceRoleKey) {
  dbInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Important: persistSession should be false for service role client
      // to prevent accidental session overwrites.
      persistSession: false,
      autoRefreshToken: false,
    },
  })
} else {
  console.warn(
    "Supabase URL or Service Role Key is not set. " +
      "The admin database client (db) will not be available. " +
      "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment.",
  )
}

/**
 * Supabase client initialized with the Service Role Key.
 * Use this for server-side operations that require admin privileges
 * or need to bypass Row Level Security (RLS).
 * For operations within user context that should respect RLS,
 * use the client from `createServerClient` (e.g., in `lib/auth.ts`).
 */
export const db: SupabaseClient | null = dbInstance

// Example of a function that might use the admin client:
// export async function countAllUsers(): Promise<number> {
//   if (!db) {
//     console.error("Admin DB client not initialized.");
//     return 0;
//   }
//   const { count, error } = await db.from("users").select("*", { count: "exact", head: true });
//   if (error) {
//     console.error("Error counting users:", error);
//     return 0;
//   }
//   return count || 0;
// }

export default db
