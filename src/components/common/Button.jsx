import React from 'react';

/**
 * Reusable accessible Button component with variant styles and focus states
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  disabled = false,
  className = '',
  onClick,
  'aria-label': ariaLabel,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow focus:ring-brand-500 border border-brand-600 dark:border-brand-500 dark:focus:ring-brand-400',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 border border-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:focus:ring-slate-500',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-brand-500 dark:bg-[#181A22] dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-600',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 border border-rose-600 dark:focus:ring-rose-400',
    dangerGhost: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:ring-rose-400 dark:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5 font-semibold',
    icon: 'p-2.5 text-sm',
    iconSm: 'p-1.5 text-xs',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className={size === 'sm' || size === 'iconSm' ? 'w-4 h-4' : 'w-4 h-4'} aria-hidden="true" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className={size === 'sm' || size === 'iconSm' ? 'w-4 h-4' : 'w-4 h-4'} aria-hidden="true" />}
    </button>
  );
}
