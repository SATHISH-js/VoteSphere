import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pollService from '../services/pollService';
import { useWebSocket } from '../hooks/useWebSocket';
import PollResult from '../components/poll/PollResult';
import LiveIndicator from '../components/poll/LiveIndicator';
import ShareModal from '../components/poll/ShareModal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import {
  Share2,
  ExternalLink,
  PieChart,
  Lock,
  Radio,
  ArrowLeft,
} from 'lucide-react';

export function PollResultsPage() {
  const { pollId } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Hook up WebSocket real-time subscription
  const { results, activeViewers, lastUpdated } = useWebSocket(
    poll?.id,
    poll?.results || null
  );

  useEffect(() => {
    const fetchPollData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pollService.getPublicPoll(pollId);
        setPoll(data);
      } catch (err) {
        setError(err.message || 'Poll not found');
      } finally {
        setLoading(false);
      }
    };

    if (pollId) {
      fetchPollData();
    }
  }, [pollId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="space-y-3 pt-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <ErrorState
          title="Results Unavailable"
          message={error || 'Could not load poll results.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const isClosed = poll.status === 'closed';
  const totalVotes = results?.totalVotes ?? poll.totalVotes ?? 0;
  const currentResults = results?.results || [];
  const maxVotes = Math.max(...currentResults.map((r) => r.votes || 0), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 flex flex-col justify-center">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Navigation & Presence Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/poll/${poll.slug || poll.id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Voting Page</span>
          </button>

          <LiveIndicator
            activeViewers={activeViewers}
            lastUpdated={lastUpdated}
            isLive={!isClosed}
          />
        </div>

        {/* Live Results Card */}
        <Card className="p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isClosed ? 'zinc' : 'emerald'}>
                {isClosed ? 'Poll Closed' : 'Live Polling'}
              </Badge>
              {isClosed && (
                <span className="text-xs text-zinc-500">No longer accepting votes</span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 leading-snug">
              {poll.question}
            </h1>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {currentResults.length > 0 ? (
              currentResults.map((opt) => (
                <PollResult
                  key={opt.optionId}
                  option={opt}
                  totalVotes={totalVotes}
                  isLeading={opt.votes === maxVotes && maxVotes > 0}
                />
              ))
            ) : (
              <p className="text-xs text-zinc-400 text-center py-6">
                Waiting for audience responses...
              </p>
            )}
          </div>

          {/* Real-time Status Footer */}
          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <div>
              <span>Total Votes: </span>
              <strong className="text-zinc-900 font-bold tabular-nums">{totalVotes}</strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareModal(true)}
                leftIcon={Share2}
              >
                Share
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        poll={poll}
      />
    </div>
  );
}

export default PollResultsPage;
