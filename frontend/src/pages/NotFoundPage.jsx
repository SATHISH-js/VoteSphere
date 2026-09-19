import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { Radio, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
        <Radio className="w-8 h-8" />
      </div>

      <h1 className="text-4xl font-black tracking-tight text-zinc-900">404</h1>
      <h2 className="text-xl font-bold text-zinc-800 mt-2">Page Not Found</h2>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">
        The poll or page you are looking for does not exist or has been moved.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={ArrowLeft}>
          Go Back
        </Button>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;
