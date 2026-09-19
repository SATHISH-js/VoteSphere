import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { Shield, User, Mail, Database, Zap } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Account & Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Manage your account preferences and stack connectivity.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <h3 className="text-sm font-semibold text-zinc-900 pb-3 border-b border-zinc-100">
          Profile Information
        </h3>

        <div className="flex items-center gap-4">
          <Avatar name={user?.name || 'User'} size="lg" />
          <div>
            <h4 className="text-base font-bold text-zinc-900">{user?.name}</h4>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Full Name</span>
            </div>
            <p className="text-sm font-medium text-zinc-900">{user?.name}</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>Email Address</span>
            </div>
            <p className="text-sm font-medium text-zinc-900">{user?.email}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 pb-3 border-b border-zinc-100">
          Architecture Status
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>MongoDB Document Storage</span>
            </div>
            <span className="font-semibold text-emerald-700">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs">
            <div className="flex items-center gap-2 text-indigo-950 font-medium">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Redis Real-Time Pub/Sub & Atomic Counters</span>
            </div>
            <span className="font-semibold text-indigo-700">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
            <div className="flex items-center gap-2 text-zinc-800 font-medium">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>JWT Authentication & bcrypt</span>
            </div>
            <span className="font-semibold text-zinc-700">Secured</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SettingsPage;
