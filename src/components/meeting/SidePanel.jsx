import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Shared SidePanel wrapper for meeting components (Chat, Participants, Files).
 * Enforces unified Meet Hour-inspired structure, spacing, dark mode, and animations.
 */
export default function SidePanel({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  footer,
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Unmount delay for smooth exit animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 200); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute inset-y-0 right-0 md:relative w-full md:w-[320px] lg:w-[360px] flex flex-col bg-white dark:bg-[#181A22] border-l border-slate-200 dark:border-slate-800/80 shadow-2xl md:shadow-none z-30 transition-transform duration-200 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:hidden'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-transparent">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label={`Close ${title}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto dark-scroll p-4 flex flex-col">
        {children}
      </div>

      {/* Optional Sticky Footer (e.g. Chat Input) */}
      {footer && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#181A22]">
          {footer}
        </div>
      )}
    </div>
  );
}
