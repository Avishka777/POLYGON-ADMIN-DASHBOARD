/**
 * Developer Workspace Security Verification
 * 
 * Passcode is securely hashed with salted SHA-256.
 * The plain text passcode does NOT exist anywhere in this repository.
 */

const DEV_SALT = 'polygon_sec_dev_2026';
const DEV_HASH = '72b34e6e140180d1d2ef16f83a58a3ef8dbf8ac7a91b7fe50011b99ce451bdd3';

export async function verifyDeveloperPasscode(input: string): Promise<boolean> {
  if (!input || typeof input !== 'string') return false;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(DEV_SALT + input.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex === DEV_HASH;
  } catch {
    return false;
  }
}

const DEV_AUTH_SESSION_KEY = 'polygon_dev_authenticated_session';

export function isDeveloperAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(DEV_AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDeveloperAuthenticated(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (authenticated) {
      sessionStorage.setItem(DEV_AUTH_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(DEV_AUTH_SESSION_KEY);
    }
  } catch {
    // Ignore
  }
}

export function clearDeveloperAccess(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(DEV_AUTH_SESSION_KEY);
  } catch {
    // Ignore
  }
}

