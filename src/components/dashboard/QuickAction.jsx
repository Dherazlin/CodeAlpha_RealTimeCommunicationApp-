import React from 'react';

/**
 * Clean Quick Action tile for "New Meeting" and "Join with Code"
 */
export default function QuickAction({
  title,
  subtitle,
  icon: Icon,
  variant = 'primary', // 'primary' | 'secondary'
  onClick,
}) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 flex items-start gap-4 ${
        isPrimary
          ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white border-brand-500 shadow-card hover:shadow-lg hover:from-brand-700 hover:to-brand-800'
          : 'bg-white text-slate-800 border-slate-200/90 shadow-subtle hover:border-slate-300 hover:shadow-card'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
          isPrimary
            ? 'bg-white/15 text-white backdrop-blur-xs'
            : 'bg-brand-50 text-brand-600 border border-brand-100'
        }`}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-bold tracking-tight ${isPrimary ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className={`text-xs mt-0.5 leading-relaxed ${isPrimary ? 'text-brand-100' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}
