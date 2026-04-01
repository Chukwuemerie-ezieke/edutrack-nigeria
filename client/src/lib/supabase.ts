import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hflzmhjqeqgqsivlddem.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GUuLt8pcoXYTDO5OnzBQyQ_nsABbmFS';

// In-memory storage to avoid localStorage (blocked in sandboxed iframes)
const memoryStorage: Record<string, string> = {};
const customStorage = {
  getItem: (key: string) => memoryStorage[key] ?? null,
  setItem: (key: string, value: string) => { memoryStorage[key] = value; },
  removeItem: (key: string) => { delete memoryStorage[key]; },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Check if Supabase is actually configured (not placeholder)
export function isSupabaseConfigured(): boolean {
  return supabaseUrl.includes('supabase.co') && supabaseUrl !== 'https://placeholder.supabase.co';
}
