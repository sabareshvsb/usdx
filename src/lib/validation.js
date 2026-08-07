const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export const MAX_JSON_BODY_BYTES = 16 * 1024;

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function cleanString(value, { maxLength } = {}) {
  if (typeof value !== "string") return null;
  let cleaned = value.replace(CONTROL_CHARS, "").trim();
  if (maxLength && cleaned.length > maxLength) return null;
  return cleaned;
}

export function sanitizeEmail(value) {
  const cleaned = cleanString(value, { maxLength: 254 });
  if (!cleaned) return null;
  if (cleaned.length > 254 || !EMAIL_REGEX.test(cleaned)) return null;
  return cleaned;
}

export function sanitizeName(value) {
  const cleaned = cleanString(value, { maxLength: 80 });
  if (!cleaned) return null;
  return cleaned;
}

export function sanitizeWallet(value) {
  const cleaned = cleanString(value, { maxLength: 42 });
  if (!cleaned) return null;
  if (cleaned.length !== 42 || !WALLET_REGEX.test(cleaned)) return null;
  return cleaned;
}

export function sanitizeDate(value) {
  const cleaned = cleanString(value, { maxLength: 10 });
  if (!cleaned || !DATE_REGEX.test(cleaned)) return null;
  const [year, month, day] = cleaned.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return cleaned;
}

export function sanitizeBoolean(value) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  return null;
}

export function sanitizeStakeAmount(value) {
  const num = Number(value);
  if (typeof value !== "number" || !Number.isFinite(num)) return null;
  if (![500, 1000, 5000].includes(num)) return null;
  return num;
}

export async function parseJsonBody(request, maxBytes = MAX_JSON_BODY_BYTES) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, status: 400, error: "Expected a JSON request body." };
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large." };
  }

  if (!request.body) {
    return { ok: false, status: 400, error: "Missing request body." };
  }

  const chunks = [];
  let received = 0;
  const reader = request.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, status: 413, error: "Request body is too large." };
      }
      chunks.push(Buffer.from(value));
    }
  } catch {
    return { ok: false, status: 400, error: "Invalid request body." };
  }

  const text = chunks.length ? Buffer.concat(chunks).toString("utf8") : "";
  if (!text) {
    return { ok: false, status: 400, error: "Missing request body." };
  }

  try {
    const data = JSON.parse(text);
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, status: 400, error: "Invalid request body." };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body." };
  }
}
