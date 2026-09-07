import React from 'react';
import { Menu, Search, Bell, Sparkles } from 'lucide-react';
import Avatar from '../common/Avatar';
import { currentUser } from '../../data/mockData';

export default function Header({ onOpenSidebar, searchQuery = '', onSearchChange }) {
  return (
    <header className="h-16 px-4 lg:px-8 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 lg:gap-4 flex-1 max-w-lg">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search meetings, recordings, team members..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-transparent focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 border border-brand-100 text-brand-700 text-xs rounded-full font-medium">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Demo Environment</span>
        </div>

        <button
          type="button"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2 pl-1">
          <Avatar
            src={currentUser.avatar}
            name={currentUser.name}
            initials={currentUser.initials}
            size="sm"
            status={currentUser.status}
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              {currentUser.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
