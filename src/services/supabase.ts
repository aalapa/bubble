import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient, SupabaseClient} from '@supabase/supabase-js';

const STORAGE_KEY_URL = '@supabase_url';
const STORAGE_KEY_ANON_KEY = '@supabase_anon_key';

let supabaseInstance: SupabaseClient | null = null;

export async function getSupabaseConfig(): Promise<{
  url: string;
  anonKey: string;
} | null> {
  const url = await AsyncStorage.getItem(STORAGE_KEY_URL);
  const anonKey = await AsyncStorage.getItem(STORAGE_KEY_ANON_KEY);
  if (url && anonKey) {
    return {url, anonKey};
  }
  return null;
}

export async function saveSupabaseConfig(
  url: string,
  anonKey: string,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_URL, url.trim());
  await AsyncStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey.trim());
  supabaseInstance = null; // Reset so it gets recreated
}

export async function clearSupabaseConfig(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_URL);
  await AsyncStorage.removeItem(STORAGE_KEY_ANON_KEY);
  supabaseInstance = null;
}

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (supabaseInstance) return supabaseInstance;

  const config = await getSupabaseConfig();
  if (!config) return null;

  supabaseInstance = createClient(config.url, config.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseInstance;
}

export async function isConfigured(): Promise<boolean> {
  const config = await getSupabaseConfig();
  return config !== null;
}
