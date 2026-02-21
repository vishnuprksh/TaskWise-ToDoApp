import React, { useState } from 'react';
import { Eye, EyeOff, RefreshCw, LogOut, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { user, signIn, signInWithEmail, signUpWithEmail, sendPasswordReset, signOut, syncNow, isSyncing } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const showMsg = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleEmailAuth = async () => {
    if (!email || !password) { showMsg('Please enter both email and password'); return; }
    setIsLoading(true);
    try {
      if (isSignUp) await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (error) {
      showMsg(error.message);
    } finally { setIsLoading(false); }
  };

  const handlePasswordReset = async () => {
    if (!email) { showMsg('Enter your email to reset password'); return; }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      showMsg('Password reset email sent!', 'success');
    } catch (error) { showMsg(error.message); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    try { await signIn(); }
    catch (error) { showMsg(error.message); }
  };

  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
      </div>
      <div className="page-body" style={{ maxWidth: 600 }}>
        {/* Account Section */}
        <div className="settings-section">
          <div className="settings-section-title">Account</div>
          {user ? (
            <div className="profile-card">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="profile-avatar" />
              ) : (
                <div className="user-avatar-placeholder" style={{ width: 56, height: 56, fontSize: 22 }}>
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div className="profile-name">{user.displayName || 'User'}</div>
                <div className="profile-email">{user.email}</div>
              </div>
              <button className="btn btn-danger" onClick={signOut}><LogOut size={18} /> Sign Out</button>
            </div>
          ) : (
            <div className="auth-form">
              <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 16 }}>
                Sign in to sync your tasks across devices.
              </p>
              <input
                className="form-input"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <div className="password-container">
                <input
                  className="form-input"
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <button className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {!isSignUp && (
                <button style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', alignSelf: 'flex-end', fontWeight: 600, fontSize: 14 }} onClick={handlePasswordReset}>
                  Forgot Password?
                </button>
              )}

              <button className="btn btn-primary" style={{ width: '100%', padding: 16 }} onClick={handleEmailAuth} disabled={isLoading}>
                {isLoading ? <Loader size={18} className="spinner" /> : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>

              <button style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textAlign: 'center', fontWeight: 600, fontSize: 14, padding: 8 }} onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>

              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">OR</span>
                <div className="auth-divider-line" />
              </div>

              <button className="google-btn" onClick={handleGoogleSignIn}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Sync Section */}
        {user && (
          <div className="settings-section">
            <div className="settings-section-title">Sync</div>
            <button className="btn btn-primary" style={{ width: '100%', padding: 16 }} onClick={syncNow} disabled={isSyncing}>
              {isSyncing ? <Loader size={18} className="spinner" /> : <RefreshCw size={18} />}
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
              Your data is automatically synced when you make changes.
            </p>
          </div>
        )}

        <div className="footer-version">TaskWise Web v1.0.0</div>

        {/* Toast Message */}
        {message && <div className={`toast ${message.type}`}>{message.text}</div>}
      </div>
    </>
  );
}
