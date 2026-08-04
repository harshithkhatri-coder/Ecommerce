const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yhvhqivqjapdujiiyjwg.supabase.co';
const rawKey = (process.env.SUPABASE_ANON_KEY || '').trim();

// A real Supabase anon API key is a JWT string starting with 'eyJ' and does NOT start with 'http'
const isValidJwt = Boolean(
  rawKey &&
  rawKey.startsWith('eyJ') &&
  !rawKey.startsWith('http') &&
  !rawKey.includes('your-anon-key') &&
  rawKey.split('.').length === 3
);

const isSupabaseReady = isValidJwt;

// Dummy key strictly for SDK initialization to avoid syntax crash when key is not added yet
const SAFE_ANON_KEY = isValidJwt
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodmhxaXZxamFwZHVqaWl5andnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.placeholder_key';

const supabase = createClient(SUPABASE_URL, SAFE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

module.exports = { supabase, SUPABASE_URL, SUPABASE_ANON_KEY: rawKey, isSupabaseReady };
