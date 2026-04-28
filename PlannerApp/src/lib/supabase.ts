import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Session managed by Clerk; Supabase only used for Storage
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
