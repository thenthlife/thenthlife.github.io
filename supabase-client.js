/**
 * SUPABASE CLIENT — nth Life Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Loads the Supabase JS client, signs the user in anonymously on first visit,
 * and exports the client instance for use across all pages.
 *
 * Phase 3: when accounts arrive, call supabaseClient.auth.linkIdentity()
 * to upgrade anonymous session to email/password. All data transfers automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL = 'https://czutbrcprcodkfzhjhna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dXRicmNwcmNvZGtmemhqaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTc0MTAsImV4cCI6MjA5Mjc5MzQxMH0.U_NORtALlef6tOFDkaYaKbsmk3jviF_mYWgCUwUh9Og';

// Loaded via CDN in each HTML page before this script
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Signs the user in anonymously if no session exists.
 * Completely silent — no UI, no prompt, no user action required.
 * Returns the user object.
 */
async function ensureAnonymousSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session?.user) {
    return session.user;
  }

  // No session — create anonymous one
  const { data, error } = await supabaseClient.auth.signInAnonymously();
  if (error) {
    console.warn('Supabase anon auth failed — running in local-only mode:', error.message);
    return null;
  }

  return data.user;
}

/**
 * Returns the current user ID, or null if offline/auth failed.
 */
async function getCurrentUserId() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user?.id || null;
}
