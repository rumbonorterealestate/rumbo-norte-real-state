/* =============================================
   SUPABASE CONFIG — Rumbo Norte Real Estate
   ============================================= */

// IMPORTANTE: Reemplazar estos valores con los de tu proyecto Supabase
const SUPABASE_URL = 'https://vbnyasxkvubcnhvkrkmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibnlhc3hrdnViY25odmtya214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTc4MzcsImV4cCI6MjA5MDEzMzgzN30.SdDUadeYGynzqTvufSQIYPEiGbgzu7Tm03nUjEluQYQ';

const { createClient } = supabase;
window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
