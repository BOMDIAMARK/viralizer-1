import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { User } from "@supabase/supabase-js"

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
export async function getCurrentSession() {
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
 * This matches the error message expecting `auth` as a named export.
 */
export const auth = {
  getUser: getCurrentUser,
  getSession: getCurrentSession,
  // You can add other common auth functions here, e.g., signOut
  // signOut: async () => {
  //   const supabase = createSupabaseServerClient();
  //   return supabase.auth.signOut();
  // }
}

export default auth
