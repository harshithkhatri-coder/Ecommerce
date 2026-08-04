import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://yhvhqivqjapdujiiyjwg.supabase.co';
const rawKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

const isValidJwt = Boolean(
  rawKey &&
  rawKey.startsWith('eyJ') &&
  !rawKey.startsWith('http') &&
  !rawKey.includes('your-anon-key') &&
  rawKey.split('.').length === 3
);

export const isSupabaseReady = isValidJwt;

const SAFE_ANON_KEY = isValidJwt
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodmhxaXZxamFwZHVqaWl5andnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.placeholder_key';

export const supabase = createClient(SUPABASE_URL, SAFE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
