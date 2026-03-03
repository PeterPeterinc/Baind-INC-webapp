export const AUTH_COOKIE_NAME = "baind_auth";
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export function getExpectedPassword(): string {
  const value = process.env.APP_PASSWORD;
  if (!value) {
    throw new Error("APP_PASSWORD ontbreekt in environment variables.");
  }
  return value;
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function createAuthToken(): Promise<string> {
  const password = getExpectedPassword();
  return sha256(`baind-auth-v1:${password}`);
}

export async function isValidAuthToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const expected = await createAuthToken();
    return token === expected;
  } catch {
    return false;
  }
}

