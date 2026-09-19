import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import siteConfig from '../../config/siteConfig';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import { Radio, Menu, X, PlusCircle, LayoutDashboard, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shadow-indigo-500/20 group-hover:bg-indigo-700 transition-colors">
            <Radio className="w-5 h-5 animate-pulse-gentle" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900">
            {siteConfig.logo.textPrefix}<span className="text-indigo-600">{siteConfig.logo.textHighlight}</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
          <Link to="/#features" className="hover:text-zinc-900 transition-colors">
            Features
          </Link>
          <Link to="/#how-it-works" className="hover:text-zinc-900 transition-colors">
            How It Works
          </Link>
          <Link to="/demo" className="hover:text-indigo-600 transition-colors">
            Live Demo
          </Link>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/polls/create')}
                leftIcon={PlusCircle}
              >
                Create Poll
              </Button>

              <Link
                to="/dashboard"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <Avatar name={user?.name || 'User'} size="sm" />
                <span className="text-xs font-semibold text-zinc-800">{user?.name}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
          >
            Features
          </Link>
          <Link
            to="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg"
          >
            How It Works
          </Link>
          <Link
            to="/demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
          >
            Try Demo
          </Link>

          <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full" leftIcon={LayoutDashboard}>
                    Dashboard
                  </Button>
                </Link>
                <Link
                  to="/polls/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="primary" className="w-full" leftIcon={PlusCircle}>
                    Create Poll
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full text-rose-600"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  leftIcon={LogOut}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
