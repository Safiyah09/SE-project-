import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Eye, EyeOff, Lock, Mail,
  ArrowRight, Package, BarChart3, TrendingUp, AlertCircle,
} from 'lucide-react';

const features = [
  { Icon: Package, title: 'Smart Inventory', desc: 'Real-time stock tracking with low-stock alerts' },
  { Icon: BarChart3, title: 'Analytics', desc: 'Insightful reports and sales dashboards' },
  { Icon: TrendingUp, title: 'Billing', desc: 'Fast, accurate billing with PDF receipts' },
];

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      // AuthContext handles redirect to /dashboard
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle input ────────────────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    if (serverError) setServerError('');
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-green-50 selection:text-[#1a5d2e] bg-[#f7f8f6]">

      {/* ── Left Branding Section ─────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden shrink-0 border-r border-black/5"
        style={{ background: 'linear-gradient(135deg, #2f8f46 0%, #2a7d3d 100%)' }}
      >
        {/* Logo */}
        <div className="relative flex items-center gap-2.5 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-white/95 flex items-center justify-center shadow-sm">
            <ShoppingCart size={20} className="text-[#2f8f46]" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <span className="text-white font-bold text-xl tracking-tight">Grocery Inventory</span>
            <p className="text-green-100/40 text-[9px] font-bold uppercase tracking-wider">Inventory OS</p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative max-w-sm">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-white text-[10px] font-bold mb-5">
            <span className="w-1 h-1 rounded-full bg-green-300" />
            Next-Gen Management
          </div>
          <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight mb-5">
            Control your <br />
            <span className="text-[#9cf5b1]">inventory</span> with <br />
            absolute precision.
          </h2>
          <p className="text-green-50/70 text-sm leading-relaxed max-w-[320px] font-medium mb-8">
            The professional companion for modern grocery stores. Track, bill, and scale your business effortlessly.
          </p>

          {/* Feature List */}
          <div className="space-y-3.5">
            {features.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">{title}</p>
                  <p className="text-green-100/50 text-[11px] mt-1 font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-green-100/20 text-[10px] font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Grocery Inventory Terminal
          </p>
        </div>
      </div>

      {/* ── Right Login Section ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-2xl border border-[#dbe4da]/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] animate-fade-in">

          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#2f8f46] flex items-center justify-center shadow-sm">
              <ShoppingCart size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[#172b1f] font-bold text-xl tracking-tight">Grocery Inventory</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-[#172b1f] tracking-tight">Admin Sign In</h1>
            <p className="text-[#66736b] mt-1 text-[13px] font-medium">
              Access your inventory dashboard to manage items
            </p>
          </div>

          {/* Server Error Banner */}
          {serverError && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 animate-fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-rose-900 leading-tight">Authentication failed</p>
                <p className="text-[10px] text-rose-600 mt-0.5 font-medium">{serverError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-bold text-[#8a948d] uppercase tracking-wider ml-0.5">Email Address</label>
              <div className="relative group">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="admin@groceryinventory.com"
                  className={`w-full h-11 bg-white border border-[#dbe4da] text-[#172b1f] rounded-xl pl-10 pr-4 outline-none focus:border-[#2f8f46] transition-colors text-sm font-medium placeholder:text-[#9aa59f] ${errors.email ? 'border-rose-300 bg-rose-50/20' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[10px] text-rose-600 font-bold flex items-center gap-1 ml-0.5">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[10px] font-bold text-[#8a948d] uppercase tracking-wider ml-0.5">Password</label>
              <div className="relative group">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a948d] group-focus-within:text-[#2f8f46] transition-colors" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  className={`w-full h-11 bg-white border border-[#dbe4da] text-[#172b1f] rounded-xl pl-10 pr-10 outline-none focus:border-[#2f8f46] transition-colors text-sm font-medium placeholder:text-[#9aa59f] ${errors.password ? 'border-rose-300 bg-rose-50/20' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a948d] hover:text-[#172b1f] transition-colors p-1"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[10px] text-rose-600 font-bold flex items-center gap-1 ml-0.5">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#2f8f46] hover:bg-[#26763a] text-white rounded-xl font-bold text-sm transition-colors duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          {/* Admin Restricted Notice */}
          <div className="mt-8 p-3.5 rounded-xl bg-[#f7f8f6] border border-[#dbe4da]/60 text-[#66736b] text-[11px] flex items-start gap-3">
            <Lock size={14} className="text-[#8a948d] shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">
              <span className="font-bold text-[#172b1f] uppercase tracking-tight">Access Restricted.</span> This terminal is for authorized personnel only. Contact system admin for assistance.
            </p>
          </div>

          <p className="text-center text-[10px] font-bold text-[#8a948d] uppercase tracking-[0.05em] mt-8">
            © {new Date().getFullYear()} Grocery Inventory OS
          </p>
        </div>
      </div>
    </div>
  );
}
