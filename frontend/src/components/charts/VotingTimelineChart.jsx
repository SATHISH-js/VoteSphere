import React from 'react';
import Card from '../common/Card';

export function VotingTimelineChart({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <Card className="p-6">
        <h4 className="text-sm font-semibold text-zinc-900 mb-2">Voting Activity Over Time</h4>
        <p className="text-xs text-zinc-400 py-8 text-center">
          Timeline data will populate as votes arrive in real time.
        </p>
      </Card>
    );
  }

  const maxVotes = Math.max(...timeline.map((t) => t.votes), 1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-semibold text-zinc-900">Voting Activity Timeline</h4>
        <span className="text-xs text-zinc-500">{timeline.length} recorded intervals</span>
      </div>

      <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-zinc-200">
        {timeline.map((point, index) => {
          const heightPercent = Math.max((point.votes / maxVotes) * 100, 8);

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded shadow-sm pointer-events-none whitespace-nowrap z-10">
                {point.votes} votes ({point.timestamp})
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full bg-indigo-500 group-hover:bg-indigo-600 rounded-t-md transition-all duration-300 min-h-[6px]"
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
        <span>{timeline[0]?.timestamp || 'Start'}</span>
        <span>{timeline[timeline.length - 1]?.timestamp || 'Recent'}</span>
      </div>
    </Card>
  );
}

export default VotingTimelineChart;
