import { useState, useRef, useEffect } from 'react';
import { verifyPasscode, DEFAULT_ADMIN_HASH } from './auth-utils.js';

export function AdminLockScreen({
  expectedHash = DEFAULT_ADMIN_HASH,
  onUnlock,
  onCancel,
}) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;
  const remainingLockoutSec = isLockedOut ? Math.ceil((lockoutUntil - Date.now()) / 1000) : 0;

  useEffect(() => {
    if (!isLockedOut) return;
    const interval = setInterval(() => {
      if (Date.now() >= lockoutUntil) {
        setLockoutUntil(null);
        setError(null);
      } else {
        // Trigger re-render to update seconds
        setAttempts((a) => a);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutUntil]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLockedOut || isVerifying || !passcode.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await verifyPasscode(passcode.trim(), expectedHash);
      if (isValid) {
        try {
          sessionStorage.setItem('lian_admin_authenticated', 'true');
        } catch {}
        onUnlock();
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          const until = Date.now() + 30000; // 30s lockout
          setLockoutUntil(until);
          setError('Too many incorrect attempts. Please wait 30 seconds.');
        } else {
          setError(`Incorrect passcode. (${5 - nextAttempts} attempts remaining)`);
        }
        setPasscode('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setError(`Verification error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="admin-lock-screen" role="dialog" aria-modal="true" aria-labelledby="lock-heading">
      <div className="admin-lock-card">
        <div className="admin-lock-header">
          <div className="admin-lock-icon" aria-hidden="true">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <span className="admin-badge">Admin Access</span>
          <h2 id="lock-heading">Protected Visual Editor</h2>
          <p className="admin-lock-sub">
            Please enter your administrator passcode to edit website text, media captions, and video embeds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="admin-lock-form">
          <div className="admin-lock-input-wrap">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error && !isLockedOut) setError(null);
              }}
              placeholder="Enter passcode..."
              disabled={isLockedOut || isVerifying}
              aria-label="Admin passcode"
              className="admin-lock-input"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="admin-lock-toggle-pwd"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide passcode' : 'Show passcode'}
              aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div className="admin-lock-error" role="alert">
              <span>⚠️</span> {error}
              {isLockedOut && ` (${remainingLockoutSec}s)`}
            </div>
          )}

          <div className="admin-lock-actions">
            <button
              type="submit"
              className="admin-btn primary full"
              disabled={isLockedOut || isVerifying || !passcode.trim()}
            >
              {isVerifying ? 'Verifying...' : 'Unlock Editor'}
            </button>

            <button
              type="button"
              className="admin-btn secondary full"
              onClick={onCancel}
              disabled={isVerifying}
            >
              Return to Website
            </button>
          </div>
        </form>

        <div className="admin-lock-footer">
          <p>
            🔒 All edits are cryptographically authenticated. Passcode verification runs entirely client-side.
          </p>
        </div>
      </div>
    </div>
  );
}
