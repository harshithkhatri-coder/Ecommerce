const { createClient } = require('@supabase/supabase-js');
if (process.env.VERCEL !== 'true') {
  require('dotenv').config();
}

const REAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodmhxaXZxamFwZHVqaWl5andnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTQ2NzAsImV4cCI6MjEwMTQzMDY3MH0.Ep96oxYYtyAZtI_oyiRPxF4q5Wrn6pZeSs56Ld2qsYc';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yhvhqivqjapdujiiyjwg.supabase.co';
const rawKey = (process.env.SUPABASE_ANON_KEY || REAL_ANON_KEY).trim();

const isValidJwt = Boolean(
  rawKey &&
  rawKey.startsWith('eyJ') &&
  !rawKey.startsWith('http') &&
  !rawKey.includes('your-anon-key') &&
  rawKey.split('.').length === 3
);

const isSupabaseReady = isValidJwt;
const SAFE_ANON_KEY = isValidJwt ? rawKey : REAL_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SAFE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

console.log("✅ Supabase Backend Client initialized for:", SUPABASE_URL);

module.exports = { supabase, SUPABASE_URL, SUPABASE_ANON_KEY: SAFE_ANON_KEY, isSupabaseReady: true };
