import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import siteConfig from '../config/siteConfig';
import PollOption from '../components/poll/PollOption';
import PollResult from '../components/poll/PollResult';
import LiveIndicator from '../components/poll/LiveIndicator';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export function DemoPollPage() {
  const navigate = useNavigate();

  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [activeViewers, setActiveViewers] = useState(19);

  const [demoResults, setDemoResults] = useState([
    { optionId: 'opt-1', optionText: 'React + Go (Gin)', votes: 148, percentage: 46.3 },
    { optionId: 'opt-2', optionText: 'Next.js + Node', votes: 88, percentage: 27.5 },
    { optionId: 'opt-3', optionText: 'Vue 3 + Python FastAPI', votes: 54, percentage: 16.9 },
    { optionId: 'opt-4', optionText: 'SvelteKit + Rust Actix', votes: 30, percentage: 9.3 },
  ]);

  const totalVotes = demoResults.reduce((acc, curr) => acc + curr.votes, 0);
  const maxVotes = Math.max(...demoResults.map((r) => r.votes));

  const handleVoteSubmit = (e) => {
    e.preventDefault();
    if (!selectedOption) return;

    // Simulate real-time Redis counter update
    setDemoResults((prev) =>
      prev.map((opt) => {
        if (opt.optionId === selectedOption) {
          const newVotes = opt.votes + 1;
          return { ...opt, votes: newVotes };
        }
        return opt;
      }).map((opt, _, arr) => {
        const newTotal = arr.reduce((sum, o) => sum + o.votes, 0);
        const pct = (opt.votes / newTotal) * 100;
        return {
          ...opt,
          percentage: parseFloat(pct.toFixed(1)),
        };
      })
    );

    setHasVoted(true);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch {}
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 flex flex-col justify-center max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Demo Mode</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
          Try {siteConfig.name} Live
        </h1>
        <p className="text-xs text-zinc-500">
          Experience zero-refresh real-time updates directly in your browser.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="indigo">Demo Sandbox</Badge>
        <LiveIndicator activeViewers={activeViewers} isLive={true} />
      </div>

      <Card className="p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-950 leading-snug">
            Which backend stack is best for building scalable real-time systems?
          </h2>
          <p className="mt-1.5 text-xs text-zinc-500">Single choice • Instant simulation</p>
        </div>

        {hasVoted ? (
          <div className="space-y-6">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Thanks for testing! Live results updated.
              </span>
              <span className="text-emerald-700">Zero Refresh</span>
            </div>

            <div className="space-y-3">
              {demoResults.map((opt) => (
                <PollResult
                  key={opt.optionId}
                  option={opt}
                  totalVotes={totalVotes}
                  isLeading={opt.votes === maxVotes}
                  hasVotedForThis={selectedOption === opt.optionId}
                />
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span>Total demo votes: <strong className="text-zinc-900">{totalVotes}</strong></span>
              <button
                onClick={() => setHasVoted(false)}
                className="text-indigo-600 font-medium hover:underline"
              >
                Vote again
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVoteSubmit} className="space-y-4">
            <div className="space-y-2.5">
              {demoResults.map((opt) => (
                <PollOption
                  key={opt.optionId}
                  option={{ id: opt.optionId, text: opt.optionText }}
                  selected={selectedOption === opt.optionId}
                  onSelect={(id) => setSelectedOption(id)}
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              disabled={!selectedOption}
            >
              Submit Vote
            </Button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center space-y-3">
          <p className="text-xs text-zinc-600">
            Want to create and share your own custom polls?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/register')}
            rightIcon={ArrowRight}
            className="w-full sm:w-auto"
          >
            Create Your Free Account
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default DemoPollPage;
