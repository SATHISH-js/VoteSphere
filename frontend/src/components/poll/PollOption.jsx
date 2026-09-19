import React from 'react';
import { Check } from 'lucide-react';

export function PollOption({
  option,
  selected = false,
  isMultiple = false,
  disabled = false,
  onSelect,
}) {
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelect(option.id);
    }
  };

  return (
    <div
      role={isMultiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onSelect(option.id)}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer min-h-[56px] select-none ${
        disabled
          ? 'opacity-60 cursor-not-allowed bg-zinc-50 border-zinc-200'
          : selected
          ? 'bg-indigo-50/60 border-indigo-600 shadow-xs ring-2 ring-indigo-600/10'
          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
      }`}
    >
      <div className="flex items-center gap-3.5 pr-4 flex-1">
        {/* Checkbox / Radio Circle */}
        <div
          className={`w-5 h-5 flex items-center justify-center transition-all duration-200 shrink-0 ${
            isMultiple ? 'rounded-md' : 'rounded-full'
          } ${
            selected
              ? 'bg-indigo-600 text-white'
              : 'border-2 border-zinc-300 group-hover:border-zinc-400 bg-white'
          }`}
        >
          {selected && (
            isMultiple ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-white" />
            )
          )}
        </div>

        <span
          className={`text-sm md:text-base font-medium transition-colors ${
            selected ? 'text-indigo-950 font-semibold' : 'text-zinc-800'
          }`}
        >
          {option.text}
        </span>
      </div>
    </div>
  );
}

export default PollOption;
