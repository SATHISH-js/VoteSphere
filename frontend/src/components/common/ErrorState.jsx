import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load the requested information.',
  onRetry,
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-rose-100 bg-rose-50/30 my-6">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry} leftIcon={RefreshCw}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
