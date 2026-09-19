import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import pollService from '../services/pollService';
import StatCard from '../components/common/StatCard';
import PollCard from '../components/poll/PollCard';
import ShareModal from '../components/poll/ShareModal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton, PollListSkeleton } from '../components/common/Skeleton';
import {
  BarChart2,
  CheckCircle,
  Users,
  PlusCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSharePoll, setActiveSharePoll] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, pollsData] = await Promise.all([
        pollService.getDashboardStats().catch(() => null),
        pollService.getUserPolls().catch(() => []),
      ]);

      setStats(statsData);
      setPolls(pollsData || []);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleClosePoll = async (pollId) => {
    try {
      await pollService.closePoll(pollId);
      toast.success('Poll closed successfully');
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to close poll');
    }
  };

  const handleDeletePoll = async (pollId) => {
    try {
      await pollService.deletePoll(pollId);
      toast.success('Poll deleted');
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete poll');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {getGreeting()}, {user?.name || 'Creator'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Here is a live summary of your audience engagement and polling activity.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/polls/create')}
          leftIcon={PlusCircle}
          className="shadow-sm shadow-indigo-500/20 self-start sm:self-auto"
        >
          Create New Poll
        </Button>
      </div>

      {/* Metric Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Polls"
            value={stats?.totalPolls ?? polls.length}
            icon={Layers}
            description="Polls created to date"
          />
          <StatCard
            title="Active Polls"
            value={stats?.activePolls ?? polls.filter((p) => p.status === 'active').length}
            icon={CheckCircle}
            description="Currently accepting votes"
          />
          <StatCard
            title="Total Votes"
            value={stats?.totalVotes ?? polls.reduce((sum, p) => sum + (p.totalVotes || 0), 0)}
            icon={BarChart2}
            description="All recorded responses"
          />
          <StatCard
            title="Unique Respondents"
            value={stats?.uniqueRespondents ?? stats?.totalVotes ?? 0}
            icon={Users}
            description="Individual verified voters"
          />
        </div>
      )}

      {/* Recent Polls Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Recent Polls</h2>
          {polls.length > 0 && (
            <button
              onClick={() => navigate('/dashboard/polls')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all ({polls.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <PollListSkeleton />
        ) : polls.length === 0 ? (
          <EmptyState
            title="You haven't created any polls yet."
            description="Launch your first poll in seconds to start gathering instant feedback from your audience."
            actionText="Create your first poll"
            onAction={() => navigate('/polls/create')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {polls.slice(0, 6).map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onShare={(p) => setActiveSharePoll(p)}
                onClosePoll={handleClosePoll}
                onDeletePoll={handleDeletePoll}
              />
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(activeSharePoll)}
        onClose={() => setActiveSharePoll(null)}
        poll={activeSharePoll}
      />
    </div>
  );
}

export default DashboardPage;
