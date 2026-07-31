import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── LocalStorage key ─────────────────────────────────────────────────────────
const TOKEN_KEY = 'gms_token';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true); // true while verifying stored token
  const navigate = useNavigate();

  // ── Auto-login: verify token on mount / page refresh ──────────────────────
  useEffect(() => {
    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      // No token → skip verification, go to login
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Hit /api/auth/verify to check if token is still valid
        const { data } = await api.get('/auth/verify');

        if (data.success && data.user) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          // Token invalid on server side
          clearSession();
        }
      } catch (err) {
        // Network error or 401 → clear everything
        console.error('Token verification failed:', err.message);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    verifyStoredToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    // Calls POST /api/auth/login via axios instance
    const { data } = await api.post('/auth/login', { email, password });

    if (data.success) {
      // 1. Save token to localStorage
      localStorage.setItem(TOKEN_KEY, data.token);

      // 2. Update state
      setToken(data.token);
      setUser(data.user);

      // 3. Welcome toast
      toast.success(`Welcome back, ${data.user.name}! 👋`);

      // 4. Redirect to dashboard
      navigate('/dashboard', { replace: true });
    }

    return data;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore — we clear locally regardless
    }

    clearSession();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  }, [navigate]);

  // ── Clear session (internal helper) ───────────────────────────────────────
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth Hook ────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used within an <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
