import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, Receipt, History,
  LogOut, ShoppingCart, X, Truck, Folder
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/products',  label: 'Products',   Icon: Package },
  { to: '/categories',label: 'Categories', Icon: Folder },
  { to: '/suppliers', label: 'Suppliers',  Icon: Truck },
  { to: '/billing',   label: 'Billing',    Icon: Receipt },
  { to: '/sales',     label: 'Sales',      Icon: History },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <>
      {/* ── Sidebar Panel ────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col
          bg-[#fbfcfb] border-r border-gray-100 shadow-sm
          transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2f8f46] flex items-center justify-center shadow-sm">
              <ShoppingCart size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <span className="text-[#172b1f] font-bold text-lg tracking-tight">Grocery Inventory</span>
              <p className="text-[#8a948d] text-[9px] mt-0.5 font-bold uppercase tracking-wider">Inventory OS</p>
            </div>
          </div>
          {/* Close on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          <p className="text-[10px] font-bold text-[#8a948d] uppercase tracking-[0.15em] px-3 mb-3">
            Management
          </p>

          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group relative ${
                  isActive 
                    ? 'bg-[#dff3e4] text-[#1a5d2e]' 
                    : 'text-[#5f6f65] hover:bg-gray-50 hover:text-[#172b1f]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-[#1a5d2e]' : 'text-[#8a948d] group-hover:text-[#5f6f65]'
                    }`}
                  />
                  <span className={`flex-1 font-semibold text-sm ${isActive ? 'text-[#1a5d2e]' : 'text-[#5f6f65] group-hover:text-[#172b1f]'}`}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#2f8f46] rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── User Profile + Logout ─────────────────────────────────────── */}
        <div className="shrink-0 px-4 py-4 border-t border-gray-50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50/50 border border-gray-100/50 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#2f8f46] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[#172b1f] text-xs font-bold truncate leading-none">{user?.name || 'Admin'}</p>
              <p className="text-[#8a948d] text-[10px] truncate font-bold uppercase mt-1">{user?.role || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-sm transition-colors group"
          >
            <LogOut size={16} strokeWidth={2.5} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
