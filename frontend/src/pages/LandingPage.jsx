import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ProgressBar from '../components/common/ProgressBar';
import {
  Radio,
  Zap,
  Share2,
  ShieldCheck,
  BarChart3,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Interactive mockup state
  const [mockVotes, setMockVotes] = useState({
    opt1: 142,
    opt2: 89,
    opt3: 65,
    opt4: 24,
  });
  const [selectedMock, setSelectedMock] = useState(null);

  const totalMockVotes = Object.values(mockVotes).reduce((a, b) => a + b, 0);

  const handleMockVote = (key) => {
    if (selectedMock === key) return;
    setMockVotes((prev) => ({
      ...prev,
      [key]: prev[key] + 1,
      ...(selectedMock ? { [selectedMock]: prev[selectedMock] - 1 } : {}),
    }));
    setSelectedMock(key);
  };

  const mockOptions = [
    { id: 'opt1', label: 'React + Go (Gin)', votes: mockVotes.opt1 },
    { id: 'opt2', label: 'Next.js + Node', votes: mockVotes.opt2 },
    { id: 'opt3', label: 'Vue 3 + FastAPI', votes: mockVotes.opt3 },
    { id: 'opt4', label: 'SvelteKit + Rust', votes: mockVotes.opt4 },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Powered by Go, Redis Pub/Sub & MongoDB</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.1]">
            Ask. Vote.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              See results live.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Create engaging polls and watch responses update instantly in real time. Zero page refreshes, pure WebSocket speed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate(isAuthenticated ? '/polls/create' : '/register')}
              rightIcon={ArrowRight}
              className="w-full sm:w-auto shadow-md shadow-indigo-500/20"
            >
              Create a Poll
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/demo')}
              className="w-full sm:w-auto bg-white"
            >
              Try Live Demo
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              No account required to vote
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Sub-second Redis Pub/Sub
            </span>
          </div>
        </div>

        {/* Live Interactive Mockup */}
        <div className="mt-14 max-w-2xl mx-auto">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-indigo-500/20 via-zinc-200 to-zinc-200 shadow-2xl">
            <div className="bg-white rounded-[22px] p-6 sm:p-8 text-left border border-zinc-100">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-zinc-800">Live Preview</span>
                  <span className="text-xs text-zinc-400">• Click any option to simulate voting</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <span>38 active</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-zinc-900 mb-4">
                What is your preferred full-stack combination for real-time apps?
              </h3>

              <div className="space-y-3">
                {mockOptions.map((opt) => {
                  const percent = ((opt.votes / totalMockVotes) * 100).toFixed(1);
                  const isSelected = selectedMock === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleMockVote(opt.id)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                      }`}
                    >
                      <div className="flex justify-between text-xs font-semibold text-zinc-900 mb-1.5">
                        <span>{opt.label}</span>
                        <span className="tabular-nums">{percent}% ({opt.votes})</span>
                      </div>
                      <ProgressBar
                        percentage={parseFloat(percent)}
                        color={isSelected ? 'bg-indigo-600' : 'bg-zinc-700'}
                        height="h-2"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span>Total votes: <strong className="text-zinc-800">{totalMockVotes}</strong></span>
                <span className="text-indigo-600 font-medium">⚡ Redis counters updating live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              Features
            </h2>
            <h3 className="text-3xl font-bold text-zinc-950">
              Built for instant audience engagement
            </h3>
            <p className="mt-3 text-sm text-zinc-600">
              Everything you need to gather instant feedback during events, streams, meetings, or classrooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Real-Time Results</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Votes update instantly across all connected screens via Redis Pub/Sub and WebSockets without touching refresh.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Frictionless Sharing</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Generate instant public shortlinks and dynamic QR codes. Audience votes directly with zero account setup.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Anti-Fraud & Duplicate-Proof</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Smart fraud prevention using device & hardware fingerprinting, IP locking, and optional voter account verification.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Deep Poll Analytics</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Inspect response timelines, peak voting periods, unique respondents, and visual breakdown charts.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Mobile-First Touch UI</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Engineered with 44px+ touch targets, smooth progress bars, and zero horizontal scrolling on all devices.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <Radio className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-900 mb-2">Live Participant Presence</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Tracks active viewers in real time using Redis connection counters, displaying live room engagement.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
              How It Works
            </h2>
            <h3 className="text-3xl font-bold text-zinc-950">
              Simple 4-step live polling
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Create',
                desc: 'Draft your question and add 2 to 10 options with custom expiry and voting rules.',
              },
              {
                step: '02',
                title: 'Share',
                desc: 'Copy the unique public slug or display the QR code on a projector screen.',
              },
              {
                step: '03',
                title: 'Vote',
                desc: 'Audience selects their choices on mobile or desktop without signing in.',
              },
              {
                step: '04',
                title: 'Watch Live',
                desc: 'Results update instantly for everyone with animated bars and real-time tallies.',
              },
            ].map((item) => (
              <div key={item.step} className="p-6 bg-white rounded-2xl border border-zinc-200/80 space-y-3">
                <span className="text-2xl font-black text-indigo-600">{item.step}</span>
                <h4 className="text-base font-semibold text-zinc-900">{item.title}</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white border-t border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h3 className="text-3xl font-bold text-zinc-900">
            Ready to engage your audience in real time?
          </h3>
          <p className="text-sm text-zinc-600 max-w-lg mx-auto">
            Set up your free account in seconds and create your first live poll today.
          </p>
          <div className="pt-2 flex justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/register')}
              rightIcon={ArrowRight}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
