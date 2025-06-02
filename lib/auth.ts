import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { User, Session } from "@supabase/supabase-js" // Ensure Session is imported if used

/**
 * Retrieves the Supabase server client for server-side operations.
 * This should be used in Server Components, Route Handlers, and Server Actions.
 */
function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

/**
 * Gets the current authenticated user from Supabase on the server.
 * @returns {Promise<User | null>} The Supabase user object or null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  // Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Supabase URL or Anon Key is not defined. Cannot get current user.")
    return null
  }
  const supabase = createSupabaseServerClient()
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Gets the current session from Supabase on the server.
 * @returns {Promise<Session | null>} The Supabase session object or null if no active session.
 */
export async function getCurrentSession(): Promise<Session | null> {
  // Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Supabase URL or Anon Key is not defined. Cannot get current session.")
    return null
  }
  const supabase = createSupabaseServerClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error getting current session:", error)
    return null
  }
}

/**
 * The `auth` object provides a consistent interface for authentication tasks.
 * This is the named export the error message is looking for.
 */
export const auth = {
  getUser: getCurrentUser,
  getSession: getCurrentSession,
}

// Default export can also be provided if needed elsewhere, but the error specifically asks for a named export.
// export default auth;
