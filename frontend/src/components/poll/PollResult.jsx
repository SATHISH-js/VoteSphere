import React from 'react';
import ProgressBar from '../common/ProgressBar';
import { formatPercentage } from '../../utils/formatters';
import { Trophy } from 'lucide-react';

export function PollResult({
  option,
  totalVotes = 0,
  isLeading = false,
  hasVotedForThis = false,
}) {
  const percentage = option.percentage || 0;
  const votes = option.votes || 0;

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-300 ${
        isLeading && votes > 0
          ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs'
          : 'bg-white border-zinc-200/80'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 pr-2">
          <span className="text-sm font-semibold text-zinc-900 leading-snug">
            {option.optionText}
          </span>
          {hasVotedForThis && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
              Your Vote
            </span>
          )}
          {isLeading && votes > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Trophy className="w-3 h-3 text-amber-500" />
              Leading
            </span>
          )}
        </div>

        <div className="text-right shrink-0">
          <span className="text-sm font-bold text-zinc-900 tabular-nums">
            {formatPercentage(percentage)}
          </span>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <ProgressBar
        percentage={percentage}
        color={isLeading && votes > 0 ? 'bg-indigo-600' : 'bg-zinc-700'}
        height="h-2.5"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span className="tabular-nums">
          {votes} {votes === 1 ? 'vote' : 'votes'}
        </span>
        {totalVotes > 0 && (
          <span>{((votes / totalVotes) * 100).toFixed(0)}% of total</span>
        )}
      </div>
    </div>
  );
}

export default PollResult;
