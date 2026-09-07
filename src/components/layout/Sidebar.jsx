import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Video,
  LayoutDashboard,
  Calendar,
  Clock,
  FolderOpen,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { currentUser } from '../../data/mockData';

export default function Sidebar({ isOpen, onClose, activeTab, onTabChange }) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'meetings', label: 'Meetings', icon: Calendar, path: '/dashboard' },
    { id: 'recent', label: 'Recent', icon: Clock, path: '/dashboard' },
    { id: 'files', label: 'Files & Notes', icon: FolderOpen, path: '/dashboard' },
  ];

  const bottomNavItems = [
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard' },
    { id: 'help', label: 'Help & Docs', icon: HelpCircle, path: '/dashboard' },
  ];

  const handleNavClick = (itemId) => {
    if (onTabChange) {
      onTabChange(itemId);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Main Navigation"
      >
        {/* Top Header & Logo */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-base">Korus</span>
                <span className="text-[10px] uppercase font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded ml-1.5">
                  Phase 1
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Presence Pill (WhatsApp-style compact profile) */}
          <div className="p-3.5 mx-3 my-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex items-center gap-3">
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              initials={currentUser.initials}
              size="md"
              status={currentUser.status}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser.name}
                </p>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" title="Online" />
              </div>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.role}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
