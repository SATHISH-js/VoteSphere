import React from 'react';
import Card from '../common/Card';
import { formatPercentage } from '../../utils/formatters';

const PALETTE = [
  { bg: 'bg-indigo-600', text: 'text-indigo-600', hex: '#4f46e5' },
  { bg: 'bg-violet-500', text: 'text-violet-500', hex: '#8b5cf6' },
  { bg: 'bg-emerald-500', text: 'text-emerald-500', hex: '#10b981' },
  { bg: 'bg-amber-500', text: 'text-amber-500', hex: '#f59e0b' },
  { bg: 'bg-rose-500', text: 'text-rose-500', hex: '#f43f5e' },
  { bg: 'bg-cyan-500', text: 'text-cyan-500', hex: '#06b6d4' },
  { bg: 'bg-fuchsia-500', text: 'text-fuchsia-500', hex: '#d946ef' },
  { bg: 'bg-teal-500', text: 'text-teal-500', hex: '#14b8a6' },
];

export function VoteDistributionChart({ results = [], totalVotes = 0 }) {
  if (!results || results.length === 0) {
    return <p className="text-sm text-zinc-400 text-center py-6">No data to display</p>;
  }

  // Calculate cumulative percentages for segmented bar
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-zinc-900">Vote Distribution</h4>
        <span className="text-xs text-zinc-500">{totalVotes} total responses</span>
      </div>

      {/* Multi-Segment Stacked Bar */}
      <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden flex mb-6 shadow-inner">
        {results.map((item, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const width = item.percentage || 0;
          if (width <= 0) return null;
          return (
            <div
              key={item.optionId}
              style={{ width: `${width}%` }}
              className={`${color.bg} transition-all duration-500 hover:opacity-90`}
              title={`${item.optionText}: ${item.votes} votes (${item.percentage}%)`}
            />
          );
        })}
      </div>

      {/* Options Detailed List */}
      <div className="space-y-3">
        {results.map((item, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          return (
            <div key={item.optionId} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className={`w-2.5 h-2.5 rounded-full ${color.bg} shrink-0`} />
                <span className="font-medium text-zinc-800 truncate">{item.optionText}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-zinc-500 tabular-nums">{item.votes} votes</span>
                <span className="font-bold text-zinc-900 tabular-nums w-12 text-right">
                  {formatPercentage(item.percentage)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default VoteDistributionChart;
