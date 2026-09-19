import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export function Dropdown({ trigger, items = [], align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button
            type="button"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors focus:outline-none"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute z-30 mt-1 w-48 rounded-xl bg-white shadow-xl border border-zinc-200/80 py-1.5 focus:outline-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="my-1 border-t border-zinc-100" />;
            }

            const Icon = item.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (item.onClick) item.onClick();
                }}
                className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors text-left ${
                  item.danger
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
