const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}

function isDuplicateKeyError(message) {
  return /duplicate key value|23505|duplicate/i.test(message || "");
}

export { SUPABASE_URL, SUPABASE_SECRET_KEY, supabaseHeaders, supabaseConfigured, isDuplicateKeyError };
