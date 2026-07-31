import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Product Management',
  '/billing': 'Billing',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const title = pageTitles[location.pathname] || 'Grocery Inventory';
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-sm shadow-black/[0.01]">

      {/* Left: Hamburger + Page Title */}
      <div className="flex items-center gap-4">
        <button
          id="sidebar-toggle"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-[#5f6f65] hover:bg-gray-50 hover:text-[#172b1f] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#172b1f] leading-none">{title}</h1>
          <p className="text-[10px] text-[#8a948d] mt-1 font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Right: Search + Bell + Avatar */}
      <div className="flex items-center gap-2 sm:gap-4">



        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="user-menu-btn"
            onClick={() => setDropdownOpen((p) => !p)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2f8f46] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-none">
              <p className="text-xs font-bold text-[#172b1f]">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-[#8a948d] font-bold uppercase mt-0.5 tracking-wider">{user?.role || 'Admin'}</p>
            </div>
            <ChevronDown
              size={12}
              className={`text-[#8a948d] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-gray-50 mb-1 bg-gray-50/20">
                <p className="text-xs font-bold text-[#172b1f]">{user?.name}</p>
                <p className="text-[10px] text-[#8a948d] truncate font-medium">{user?.email}</p>
              </div>
              <button
                className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-[#5f6f65] font-bold hover:bg-gray-50 hover:text-[#172b1f] transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={14} /> Profile
              </button>
              <button
                id="navbar-logout-btn"
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-rose-600 font-bold hover:bg-rose-50 transition-colors"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
