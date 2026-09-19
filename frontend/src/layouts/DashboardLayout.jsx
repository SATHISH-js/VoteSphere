import React from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import siteConfig from '../config/siteConfig';
import Sidebar from '../components/layout/Sidebar';
import Avatar from '../components/common/Avatar';
import Skeleton from '../components/common/Skeleton';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  BarChart3,
  Settings,
  Radio,
  LogOut,
} from 'lucide-react';

export function DashboardLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white animate-bounce">
            <Radio className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-zinc-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-zinc-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-zinc-200 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Radio className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900">
              {siteConfig.logo.textPrefix}<span className="text-indigo-600">{siteConfig.logo.textHighlight}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Avatar name={user?.name || 'User'} size="sm" />
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-1 text-zinc-400 hover:text-rose-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 px-4 py-2 flex items-center justify-around">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-h-[44px] justify-center px-3 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/dashboard/polls"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-h-[44px] justify-center px-3 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              }`
            }
          >
            <ListTodo className="w-5 h-5" />
            <span>My Polls</span>
          </NavLink>

          <NavLink
            to="/polls/create"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-h-[44px] justify-center px-3 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              }`
            }
          >
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <span>Create</span>
          </NavLink>

          <NavLink
            to="/dashboard/analytics"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-h-[44px] justify-center px-3 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              }`
            }
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

export default DashboardLayout;
