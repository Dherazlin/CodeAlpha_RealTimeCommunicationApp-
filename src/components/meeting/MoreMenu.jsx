import React, { useEffect, useRef } from 'react';
import { Settings, Info, AlertTriangle, Keyboard, HelpCircle } from 'lucide-react';

export default function MoreMenu({ isOpen, onClose, onOpenSettings, onOpenInfo }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-16 right-4 sm:right-auto z-40 w-56 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-xl p-1.5 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Meeting Options
      </div>

      <div className="space-y-0.5 mt-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onOpenSettings) onOpenSettings();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-left"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Audio & Video Settings</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            if (onOpenInfo) onOpenInfo();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-left"
        >
          <Info className="w-4 h-4 text-slate-400" />
          <span>Meeting Information</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            alert('Mock Action: Report Problem dialog will connect in a future release.');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-left"
        >
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <span>Report a Problem</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            alert('Keyboard shortcuts:\n• Space / M: Toggle Mic\n• V: Toggle Camera\n• C: Open Chat\n• P: Participants');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-left"
        >
          <Keyboard className="w-4 h-4 text-slate-400" />
          <span>Keyboard Shortcuts</span>
        </button>
      </div>
    </div>
  );
}
