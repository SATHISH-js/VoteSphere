import React from 'react';
import { BarChart3 } from 'lucide-react';
import Button from './Button';

export function EmptyState({
  icon: Icon = BarChart3,
  title = 'No data available',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-white/50 my-6">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">{description}</p>
      {actionText && onAction && (
        <div className="mt-5">
          <Button size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
