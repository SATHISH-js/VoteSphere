import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import siteConfig from '../../config/siteConfig';
import Avatar from '../common/Avatar';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  Radio,
} from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/polls', label: 'My Polls', icon: ListTodo },
    { to: '/polls/create', label: 'Create Poll', icon: PlusCircle },
    { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-white border-r border-zinc-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden md:flex transition-all duration-200">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center justify-center lg:justify-start px-4 lg:px-6 border-b border-zinc-100">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Radio className="w-4 h-4 animate-pulse-gentle" />
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900 hidden lg:inline">
              {siteConfig.logo.textPrefix}<span className="text-indigo-600">{siteConfig.logo.textHighlight}</span>
            </span>
          </NavLink>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 lg:p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] justify-center lg:justify-start ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 lg:w-4 lg:h-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout Bottom Section */}
      <div className="p-3 lg:p-4 border-t border-zinc-100 space-y-3">
        <div className="flex items-center gap-3 justify-center lg:justify-start px-1">
          <Avatar name={user?.name || 'User'} size="md" />
          <div className="min-w-0 flex-1 hidden lg:block">
            <p className="text-xs font-semibold text-zinc-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[40px]"
          title="Log out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline">Log out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
