import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import pollService from '../services/pollService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ShareModal from '../components/poll/ShareModal';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  BarChart2,
  Sparkles,
  Share2,
  ShieldCheck,
  Globe,
  Lock,
  Wand2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function CreatePollPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [settings, setSettings] = useState({
    multipleChoice: false,
    anonymousVoting: true,
    showResultsAfterVoting: true,
    allowVoteChanges: false,
    voterProtection: 'smart_fingerprint', // 'smart_fingerprint' | 'strict_ip' | 'require_account'
  });
  const [duration, setDuration] = useState('none'); // 'none', '1h', '24h', '7d'

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [createdPoll, setCreatedPoll] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Quick Poll Templates
  const templates = [
    {
      title: '👍 Yes / No / Maybe',
      question: 'Do you agree with this proposal?',
      options: ['Yes, definitely', 'No, disagree', 'Need more info'],
    },
    {
      title: '⭐ 1 to 5 Rating',
      question: 'How would you rate your recent experience?',
      options: ['5 - Excellent', '4 - Good', '3 - Average', '2 - Poor', '1 - Very Poor'],
    },
    {
      title: '📅 Day of the Week',
      question: 'Which day is best for our team meetup?',
      options: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    },
    {
      title: '🎯 Priority Poll',
      question: 'What should our next top priority be?',
      options: ['Feature updates', 'Speed & Performance', 'Mobile UX', 'Bug fixes'],
    },
  ];

  const applyTemplate = (t) => {
    setQuestion(t.question);
    setOptions(t.options);
    setErrors({});
    toast.success(`Loaded "${t.title}" template!`);
  };

  const handleAddOption = () => {
    if (options.length >= 10) {
      toast.error('Maximum 10 options allowed per poll');
      return;
    }
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      toast.error('Polls require at least 2 options');
      return;
    }
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleKeyDownOption = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === options.length - 1 && options.length < 10) {
        handleAddOption();
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!question.trim()) {
      newErrors.question = 'Poll question is required';
    } else if (question.trim().length < 5) {
      newErrors.question = 'Question must be at least 5 characters long';
    } else if (question.trim().length > 300) {
      newErrors.question = 'Question cannot exceed 300 characters';
    }

    const filledOptions = options.map((o) => o.trim());
    if (filledOptions.some((o) => !o)) {
      newErrors.options = 'All option fields must have text';
    } else if (new Set(filledOptions.map((o) => o.toLowerCase())).size !== filledOptions.length) {
      newErrors.options = 'All options must be unique';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload = {
        question: question.trim(),
        options: options.map((o) => o.trim()),
        settings,
        duration,
      };

      const poll = await pollService.createPoll(payload);
      setCreatedPoll(poll);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      toast.success('Poll launched successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to create poll');
    } finally {
      setIsLoading(false);
    }
  };

  const copyUrlToClipboard = () => {
    if (!createdPoll) return;
    const url = createdPoll.publicUrl || `${window.location.origin}/poll/${createdPoll.slug || createdPoll.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // SUCCESS / POST-LAUNCH VIEW
  if (createdPoll) {
    const publicUrl =
      createdPoll.publicUrl ||
      `${window.location.origin}/poll/${createdPoll.slug || createdPoll.id}`;

    return (
      <div className="max-w-xl mx-auto space-y-6 px-3 sm:px-0">
        <Card className="p-6 sm:p-8 space-y-6 text-center border-emerald-200 bg-emerald-50/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              Your Poll is Live!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
              Share your link with friends, colleagues, or your audience to begin collecting real-time responses.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-zinc-200 text-left space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Question</p>
            <p className="text-sm font-semibold text-zinc-900">{createdPoll.question}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="indigo">{createdPoll.options?.length || 0} Options</Badge>
              {createdPoll.settings?.voterProtection === 'require_account' && (
                <Badge variant="amber">Account Required</Badge>
              )}
              {createdPoll.settings?.voterProtection === 'strict_ip' && (
                <Badge variant="blue">1 Vote Per IP</Badge>
              )}
              {(!createdPoll.settings?.voterProtection || createdPoll.settings?.voterProtection === 'smart_fingerprint') && (
                <Badge variant="emerald">Smart Anti-Fraud</Badge>
              )}
            </div>
          </div>

          {/* Share Link Input */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600 focus:outline-none min-h-[44px]"
              />
              <Button
                variant={copied ? 'success' : 'primary'}
                onClick={copyUrlToClipboard}
                leftIcon={copied ? Check : Copy}
                className="shrink-0 min-h-[44px]"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowShareModal(true)}
              leftIcon={Share2}
              className="w-full sm:w-auto bg-white min-h-[44px]"
            >
              Share QR & Social
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/poll/${createdPoll.slug || createdPoll.id}/results`)}
              leftIcon={BarChart2}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Live Results
            </Button>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-center">
            <button
              onClick={() => {
                setCreatedPoll(null);
                setQuestion('');
                setOptions(['', '']);
              }}
              className="text-xs font-semibold text-indigo-600 hover:underline min-h-[36px] flex items-center"
            >
              + Create another poll
            </button>
          </div>
        </Card>

        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          poll={createdPoll}
        />
      </div>
    );
  }

  // CREATE FORM
  return (
    <div className="max-w-2xl w-full mx-auto space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Create a New Poll</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Pick a quick template or define your own question, choose fraud prevention, and launch instantly.
        </p>
      </div>

      {/* Quick Templates Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
          <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Quick 1-Click Templates:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyTemplate(t)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-700 border border-transparent hover:border-indigo-200 transition-colors min-h-[36px] flex items-center gap-1"
            >
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 sm:p-7 space-y-6">
          {/* Question */}
          <Input
            label="Poll Question"
            placeholder="e.g. What is your favorite programming language?"
            value={question}
            error={errors.question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (errors.question) setErrors({ ...errors, question: null });
            }}
            helperText={`${question.length}/300 characters`}
            required
          />

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">
                Answer Options (2 - 10)
              </label>
              <span className="text-xs text-zinc-400">{options.length} options</span>
            </div>

            {errors.options && (
              <p className="text-xs text-rose-600 font-medium">{errors.options}</p>
            )}

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 w-5 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1} (press Enter to add next)`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDownOption(e, idx)}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 min-h-[44px]"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                leftIcon={Plus}
                className="mt-2 min-h-[40px]"
              >
                Add Option
              </Button>
            )}
          </div>

          {/* Fake Polling / Voter Protection Tier */}
          <div className="pt-6 border-t border-zinc-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">Fake Polling & Fraud Prevention</h4>
                <p className="text-xs text-zinc-500">Choose how duplicate and fake responses are prevented</p>
              </div>
              <span className="hidden sm:inline-block">
                <Badge variant="indigo">Security Rules</Badge>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Smart Anti-Fraud */}
              <div
                onClick={() => setSettings({ ...settings, voterProtection: 'smart_fingerprint' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  settings.voterProtection === 'smart_fingerprint'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900">Smart Anti-Fraud</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-snug">
                  <strong>No login needed.</strong> Device & hardware fingerprinting + IP checks block duplicate votes even in Incognito.
                </p>
                <span className="inline-block mt-2.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  Recommended (No Friction)
                </span>
              </div>

              {/* Option 2: Strict IP */}
              <div
                onClick={() => setSettings({ ...settings, voterProtection: 'strict_ip' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  settings.voterProtection === 'strict_ip'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900">Strict IP Lock</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-snug">
                  <strong>No login needed.</strong> Strict 1 vote per Wi-Fi / IP network.
                </p>
                <span className="inline-block mt-2.5 text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  Offices & Classrooms
                </span>
              </div>

              {/* Option 3: Require Account */}
              <div
                onClick={() => setSettings({ ...settings, voterProtection: 'require_account' })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  settings.voterProtection === 'require_account'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900">Verified Account</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-snug">
                  <strong>Requires user login.</strong> 100% duplicate-proof against proxies and bot networks.
                </p>
                <span className="inline-block mt-2.5 text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  Contests & Elections
                </span>
              </div>
            </div>
          </div>

          {/* General Settings Section */}
          <div className="pt-6 border-t border-zinc-100 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900">Poll Options</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer min-h-[48px]">
                <input
                  type="checkbox"
                  checked={settings.multipleChoice}
                  onChange={(e) =>
                    setSettings({ ...settings, multipleChoice: e.target.checked })
                  }
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Allow Multiple Choices</p>
                  <p className="text-[11px] text-zinc-500">Voters can pick more than one option</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer min-h-[48px]">
                <input
                  type="checkbox"
                  checked={settings.anonymousVoting}
                  onChange={(e) =>
                    setSettings({ ...settings, anonymousVoting: e.target.checked })
                  }
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Anonymous Responses</p>
                  <p className="text-[11px] text-zinc-500">Do not display respondent names</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer min-h-[48px]">
                <input
                  type="checkbox"
                  checked={settings.showResultsAfterVoting}
                  onChange={(e) =>
                    setSettings({ ...settings, showResultsAfterVoting: e.target.checked })
                  }
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Show Results After Vote</p>
                  <p className="text-[11px] text-zinc-500">Reveal live graph after submitting</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer min-h-[48px]">
                <input
                  type="checkbox"
                  checked={settings.allowVoteChanges}
                  onChange={(e) =>
                    setSettings({ ...settings, allowVoteChanges: e.target.checked })
                  }
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Allow Vote Changes</p>
                  <p className="text-[11px] text-zinc-500">Users can change their vote later</p>
                </div>
              </label>
            </div>
          </div>

          {/* Duration Picker */}
          <div className="pt-6 border-t border-zinc-100 space-y-2">
            <label className="block text-sm font-medium text-zinc-700">
              Poll Duration / Expiration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'none', label: 'No Expiry' },
                { key: '1h', label: '1 Hour' },
                { key: '24h', label: '24 Hours' },
                { key: '7d', label: '7 Days' },
              ].map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDuration(d.key)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors min-h-[40px] flex items-center justify-center ${
                    duration === d.key
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full sm:w-auto shadow-sm min-h-[44px]"
              leftIcon={Sparkles}
            >
              Launch Poll
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default CreatePollPage;
