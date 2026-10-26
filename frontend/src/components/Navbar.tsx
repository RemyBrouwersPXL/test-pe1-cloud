import React from 'react';
import { Search, Bell, PlusCircle, LogIn, LogOut, Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenNotifications: () => void;
  onOpenCreateListing: () => void;
  onHomeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAuth,
  onOpenNotifications,
  onOpenCreateListing,
  onHomeClick,
}) => {
  const { user, logout, unreadCount } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
            <Car className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tracking-tighter text-white">GEAR</span>
              <span className="text-xl font-black tracking-tighter text-amber-400">BIDS</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Enthusiast Car Auctions
            </span>
          </div>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search make, model, year, VIN (e.g. S2000, Porsche, Supra)..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (user) {
                onOpenCreateListing();
              } else {
                onOpenAuth('login');
              }
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" /> Submit a Car
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Notifications Button */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Pill */}
              <div className="flex items-center gap-2.5 pl-2 py-1 pr-1 bg-slate-800/70 border border-slate-700/70 rounded-full">
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user.username}
                  className="w-7 h-7 rounded-full object-cover border border-amber-500/50"
                />
                <span className="text-xs font-bold text-slate-200 max-w-[100px] truncate hidden lg:inline">
                  {user.username}
                </span>
                <button
                  onClick={logout}
                  className="p-1 rounded-full text-slate-400 hover:text-red-400 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/10"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
