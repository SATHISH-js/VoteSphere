import React from 'react';
import { Eye, Radio } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';

export function LiveIndicator({ activeViewers = 1, lastUpdated = null, isLive = true }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      {/* Real-time Pulsing Live Badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Live</span>
        {lastUpdated && (
          <span className="text-emerald-600/80 font-normal ml-0.5">
            • Updated {formatTimeAgo(lastUpdated)}
          </span>
        )}
      </div>

      {/* Active Viewers Count */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
        <Eye className="w-3.5 h-3.5 text-zinc-500" />
        <span className="font-semibold text-zinc-800">{activeViewers}</span>
        <span className="text-zinc-500">viewing now</span>
      </div>
    </div>
  );
}

export default LiveIndicator;
