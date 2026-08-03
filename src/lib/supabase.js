const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function isDuplicateKeyError(message) {
  return /duplicate key value|23505|duplicate/i.test(message || "");
}

export { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, supabaseHeaders, supabaseConfigured, isDuplicateKeyError };
