import React from 'react';

export function ProgressBar({
  percentage = 0,
  color = 'bg-indigo-600',
  height = 'h-3',
  className = '',
}) {
  const safePercentage = Math.min(Math.max(percentage || 0, 0), 100);

  return (
    <div className={`w-full bg-zinc-100 rounded-full overflow-hidden ${height} ${className}`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${safePercentage}%` }}
      />
    </div>
  );
}

export default ProgressBar;
