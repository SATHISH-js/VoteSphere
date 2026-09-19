import React from 'react';

export function Card({ children, className = '', hover = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-zinc-200/80 shadow-xs transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:border-zinc-300' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
