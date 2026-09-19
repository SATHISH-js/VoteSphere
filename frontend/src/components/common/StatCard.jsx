import React from 'react';
import Card from './Card';

export function StatCard({ title, value, icon: Icon, description, trend }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{value ?? '0'}</p>
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {description && <p className="mt-3 text-xs text-zinc-500">{description}</p>}
      {trend && (
        <div className="mt-3 flex items-center text-xs text-emerald-600 font-medium">
          <span>{trend}</span>
        </div>
      )}
    </Card>
  );
}

export default StatCard;
