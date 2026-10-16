/**
 * Utility functions for client-side admin authentication and passcode hashing.
 * Uses the Web Crypto API (crypto.subtle) available in all modern browsers and Node.js.
 */

// Default hash for initial passcode: 'lian2026'
export const DEFAULT_ADMIN_HASH = '3e30ea35fdd9df3739df1e2d5c209364b0d0df492ff6c76667f44d4de06c4b8a';

/**
 * Computes the SHA-256 hex digest of a string.
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function hashPasscode(text) {
  if (!text || typeof text !== 'string') return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is not supported in this environment.');
  }
  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a plain-text passcode against an expected SHA-256 hash.
 * @param {string} passcode
 * @param {string} expectedHash
 * @returns {Promise<boolean>}
 */
export async function verifyPasscode(passcode, expectedHash = DEFAULT_ADMIN_HASH) {
  if (!passcode) return false;
  const actualHash = await hashPasscode(passcode);
  return actualHash.toLowerCase() === (expectedHash || DEFAULT_ADMIN_HASH).toLowerCase();
}
