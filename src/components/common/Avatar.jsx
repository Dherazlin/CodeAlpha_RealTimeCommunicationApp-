import React, { useState } from 'react';

/**
 * Reusable Avatar component with fallback initials and status dot indicator
 */
export default function Avatar({
  src,
  alt = '',
  name = '',
  initials,
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status, // 'online' | 'busy' | 'away' | 'offline'
  isSpeaking = false,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  const computedInitials =
    initials ||
    (name
      ? name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'U');

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
    '2xl': 'w-24 h-24 text-3xl font-bold',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-4 h-4 ring-2',
    '2xl': 'w-5 h-5 ring-4',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    busy: 'bg-rose-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-400',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        isSpeaking ? 'ring-2 ring-brand-500 ring-offset-2 animate-pulse' : ''
      } ${className}`}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImageError(true)}
          className={`${sizes[size] || sizes.md} rounded-full object-cover shadow-sm`}
        />
      ) : (
        <div
          className={`${sizes[size] || sizes.md} rounded-full bg-gradient-to-br from-brand-500 to-indigo-700 text-white flex items-center justify-center font-medium shadow-sm`}
        >
          {computedInitials}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-white ${
            statusSizes[size] || statusSizes.md
          } ${statusColors[status] || statusColors.online}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
