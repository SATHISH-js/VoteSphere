import React from 'react';

export function Avatar({ name = '', size = 'md', className = '' }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={`rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-semibold flex items-center justify-center shadow-xs shrink-0 select-none ${sizeMap[size]} ${className}`}
    >
      {initials}
    </div>
  );
}

export default Avatar;
