
import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables
const getEnv = (key: string) => {
  try {
    return typeof process !== 'undefined' ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

const SUPABASE_URL = getEnv('SUPABASE_URL') || 'https://eexifrxjhvvytwbgtcsf.supabase.co';
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVleGlmcnhqaHZ2eXR3Ymd0Y3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTY0MzIsImV4cCI6MjA4Mzk3MjQzMn0.afUVSsEJzIFntKBUkNvYovOsxaNSKy1y0A1YdqSFTpk';

if (!getEnv('SUPABASE_URL')) {
  console.warn("Using fallback Supabase keys. Ensure environment variables are set for production.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
