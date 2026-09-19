import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pollService from '../services/pollService';
import StatCard from '../components/common/StatCard';
import VoteDistributionChart from '../components/charts/VoteDistributionChart';
import VotingTimelineChart from '../components/charts/VotingTimelineChart';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { CardSkeleton } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import { formatDate } from '../utils/formatters';
import {
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

export function PollAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await pollService.getAnalytics(id);
        setAnalytics(data);
      } catch (err) {
        setError(err.message || 'Failed to load poll analytics');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnalytics();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/3 bg-zinc-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <ErrorState
        title="Analytics Unavailable"
        message={error || 'Could not retrieve data for this poll.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const isClosed = analytics.status === 'closed';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={isClosed ? 'zinc' : 'emerald'}>
                {isClosed ? 'Closed' : 'Active'}
              </Badge>
              <span className="text-xs text-zinc-400">
                Created {formatDate(analytics.createdAt)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
              {analytics.question}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/poll/${analytics.pollId}/results`)}
              leftIcon={ExternalLink}
            >
              View Live Stream
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Votes"
          value={analytics.totalVotes}
          icon={BarChart3}
          description="Cumulative cast responses"
        />
        <StatCard
          title="Unique Respondents"
          value={analytics.uniqueVoters}
          icon={Users}
          description="Verified distinct devices"
        />
        <StatCard
          title="Peak Period"
          value={analytics.peakPeriod === 'N/A' ? 'Active' : analytics.peakPeriod}
          icon={Clock}
          description={`${analytics.peakVoteCount} votes at peak`}
        />
        <StatCard
          title="Poll Status"
          value={isClosed ? 'Closed' : 'Open'}
          icon={CheckCircle}
          description={analytics.expiresAt ? `Expires ${formatDate(analytics.expiresAt)}` : 'No set expiration'}
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VoteDistributionChart
          results={analytics.results}
          totalVotes={analytics.totalVotes}
        />
        <VotingTimelineChart timeline={analytics.timeline} />
      </div>
    </div>
  );
}

export default PollAnalyticsPage;
