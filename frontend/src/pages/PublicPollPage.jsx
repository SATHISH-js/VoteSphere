import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import pollService from '../services/pollService';
import { getOrCreateVoterId } from '../utils/voterId';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import PollOption from '../components/poll/PollOption';
import PollResult from '../components/poll/PollResult';
import LiveIndicator from '../components/poll/LiveIndicator';
import ShareModal from '../components/poll/ShareModal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import {
  CheckCircle2,
  Lock,
  Share2,
  BarChart2,
  ShieldCheck,
  Globe,
  LogIn,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function PublicPollPage() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Anti-bot honeypot field
  const [honeypot, setHoneypot] = useState('');

  // Voting state
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Live WebSocket Results
  const { results, activeViewers, lastUpdated } = useWebSocket(
    poll?.id,
    poll?.results || null
  );

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pollService.getPublicPoll(pollId);
        setPoll(data);

        // Check if user previously voted in this browser
        const voterHash = getOrCreateVoterId();
        const storedVoteKey = `voted_${data.id}_${voterHash}`;
        const previousVote = localStorage.getItem(storedVoteKey);
        if (previousVote) {
          try {
            setSelectedOptionIds(JSON.parse(previousVote));
            setHasVoted(true);
          } catch {}
        }
      } catch (err) {
        setError(err.message || 'Poll not found or unavailable');
      } finally {
        setLoading(false);
      }
    };

    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const handleOptionSelect = (optionId) => {
    if (!poll || poll.status === 'closed') return;

    if (poll.settings?.multipleChoice) {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptionIds([optionId]);
    }
  };

  const handleVoteSubmit = async (e) => {
    e.preventDefault();

    // Anti-bot check: if honeypot is populated, silently reject
    if (honeypot.trim() !== '') {
      toast.error('Spam submission detected');
      return;
    }

    // Require account check
    if (poll.settings?.voterProtection === 'require_account' && !isAuthenticated) {
      toast.error('Please log in first to cast your vote on this verified poll');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (selectedOptionIds.length === 0) {
      toast.error('Please select at least one option to vote');
      return;
    }

    setIsSubmitting(true);
    try {
      const voterHash = getOrCreateVoterId();
      await pollService.castVote(poll.slug || poll.id, {
        optionIds: selectedOptionIds,
        voterHash,
        userId: user?.id || user?._id || undefined,
      });

      // Save local vote persistence
      const storedVoteKey = `voted_${poll.id}_${voterHash}`;
      localStorage.setItem(storedVoteKey, JSON.stringify(selectedOptionIds));

      setHasVoted(true);
      toast.success('Your vote has been counted!');

      // Celebration confetti
      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.65 },
        });
      } catch {}
    } catch (err) {
      toast.error(err.message || 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="space-y-3 pt-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <ErrorState
          title="Poll Unavailable"
          message={error || 'The poll you are looking for does not exist or has been removed.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const isClosed = poll.status === 'closed';
  const totalVotes = results?.totalVotes ?? poll.totalVotes ?? 0;
  const currentResults = results?.results || [];
  const maxVotes = Math.max(...currentResults.map((r) => r.votes || 0), 0);
  const requiresAccount = poll.settings?.voterProtection === 'require_account';
  const isStrictIP = poll.settings?.voterProtection === 'strict_ip';

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-10 px-3 sm:px-6 flex flex-col justify-center">
      <div className="max-w-xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* Header and Live Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isClosed ? 'zinc' : 'emerald'}>
              {isClosed ? 'Poll Closed' : 'Accepting Votes'}
            </Badge>

            {poll.settings?.multipleChoice && (
              <Badge variant="indigo">Multiple Choice</Badge>
            )}

            {requiresAccount && (
              <Badge variant="amber">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Account Required
                </span>
              </Badge>
            )}

            {isStrictIP && (
              <Badge variant="blue">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> 1 Vote Per Network
                </span>
              </Badge>
            )}

            {!requiresAccount && !isStrictIP && (
              <Badge variant="emerald">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Smart Anti-Fraud
                </span>
              </Badge>
            )}
          </div>

          <LiveIndicator
            activeViewers={activeViewers}
            lastUpdated={lastUpdated}
            isLive={!isClosed}
          />
        </div>

        {/* Main Poll Card */}
        <Card className="p-5 sm:p-8 shadow-sm">
          {/* Question */}
          <div className="mb-6">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-950 leading-snug">
              {poll.question}
            </h1>
            <p className="mt-1.5 text-xs text-zinc-500">
              {poll.settings?.multipleChoice
                ? 'Select one or more options'
                : 'Select one option'}
              {poll.settings?.anonymousVoting ? ' • Anonymous response' : ''}
              {!requiresAccount ? ' • No account required to vote' : ''}
            </p>
          </div>

          {/* If verified account is required and user is not logged in */}
          {requiresAccount && !isAuthenticated && !hasVoted && !isClosed && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold">Verified Voter Sign-In Required</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                The creator of this poll requires verified accounts to submit a vote, guaranteeing authentic results.
              </p>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  leftIcon={LogIn}
                >
                  Log In to Vote
                </Button>
              </div>
            </div>
          )}

          {/* If already voted and show results is enabled */}
          {hasVoted && poll.settings?.showResultsAfterVoting ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold">Thanks for voting!</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">Live Results Below</span>
              </div>

              {/* Live Animated Option Results */}
              <div className="space-y-3">
                {currentResults.length > 0 ? (
                  currentResults.map((opt) => (
                    <PollResult
                      key={opt.optionId}
                      option={opt}
                      totalVotes={totalVotes}
                      isLeading={opt.votes === maxVotes && maxVotes > 0}
                      hasVotedForThis={selectedOptionIds.includes(opt.optionId)}
                    />
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 text-center py-4">Waiting for responses...</p>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
                <span>Total responses: <strong className="text-zinc-800">{totalVotes}</strong></span>
                <span className="text-emerald-600 font-medium">⚡ Real-time live updates</span>
              </div>

              {poll.settings?.allowVoteChanges && !isClosed && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setHasVoted(false)}
                    className="text-xs font-semibold text-indigo-600 hover:underline min-h-[36px]"
                  >
                    Change your choice
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Voting Form */
            <form onSubmit={handleVoteSubmit} className="space-y-6">
              {/* Invisible Honeypot Trap for Bot Prevention */}
              <input
                type="text"
                name="user_poll_validation_trap"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                  zIndex: -1,
                  height: 0,
                  width: 0,
                }}
              />

              {isClosed && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>This poll is closed and is no longer accepting new responses.</span>
                </div>
              )}

              <div className="space-y-3">
                {poll.options?.map((opt) => (
                  <PollOption
                    key={opt.id}
                    option={opt}
                    selected={selectedOptionIds.includes(opt.id)}
                    isMultiple={poll.settings?.multipleChoice}
                    disabled={isClosed || (requiresAccount && !isAuthenticated)}
                    onSelect={handleOptionSelect}
                  />
                ))}
              </div>

              {!isClosed && (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-sm sm:text-base font-semibold shadow-md shadow-indigo-500/20 min-h-[48px]"
                  isLoading={isSubmitting}
                  disabled={selectedOptionIds.length === 0 || (requiresAccount && !isAuthenticated)}
                >
                  {requiresAccount && !isAuthenticated ? 'Sign In to Submit Vote' : 'Submit Vote'}
                </Button>
              )}
            </form>
          )}

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors min-h-[36px]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Poll</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/poll/${poll.slug || poll.id}/results`)}
              className="flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-700 min-h-[36px]"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>View Results</span>
            </button>
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

export default PublicPollPage;
