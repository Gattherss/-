import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types";

/**
 * Create a Supabase client for Client Components.
 * This uses browser storage for session management.
 */
export function createSupabaseBrowserClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
