import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPasscode, verifyPasscode, DEFAULT_ADMIN_HASH } from '../src/auth-utils.js';

test('hashPasscode returns expected SHA-256 hex string', async () => {
  const hash = await hashPasscode('lian2026');
  assert.equal(hash, DEFAULT_ADMIN_HASH);
});

test('verifyPasscode correctly verifies valid passcode', async () => {
  const isValid = await verifyPasscode('lian2026', DEFAULT_ADMIN_HASH);
  assert.equal(isValid, true);
});

test('verifyPasscode rejects invalid passcode', async () => {
  const isInvalid = await verifyPasscode('wrong-passcode', DEFAULT_ADMIN_HASH);
  assert.equal(isInvalid, false);
});

test('verifyPasscode handles custom hashes', async () => {
  const customHash = await hashPasscode('my-new-secret-password-123');
  const valid = await verifyPasscode('my-new-secret-password-123', customHash);
  assert.equal(valid, true);

  const invalid = await verifyPasscode('wrong', customHash);
  assert.equal(invalid, false);
});
