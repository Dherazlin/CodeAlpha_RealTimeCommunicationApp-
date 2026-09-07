import React from 'react';
import Button from './Button';

/**
 * Polished empty state component for lists, search, chat, and participants
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex items-center justify-center text-slate-400 mb-3.5">
          <Icon className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
          className="mt-1"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
