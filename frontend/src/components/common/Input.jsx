import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = '',
      id,
      name,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            className={`block w-full rounded-xl border transition-all duration-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm min-h-[44px] ${
              LeftIcon ? 'pl-10' : 'pl-3.5'
            } ${RightIcon ? 'pr-10' : 'pr-3.5'} ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                : 'border-zinc-300 focus:border-indigo-600 focus:ring-indigo-600/10 bg-white hover:border-zinc-400'
            } ${className}`}
            {...props}
          />
          {RightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
              <RightIcon className="w-4 h-4" />
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-zinc-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
