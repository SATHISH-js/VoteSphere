import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import pollService from '../services/pollService';
import PollCard from '../components/poll/PollCard';
import ShareModal from '../components/poll/ShareModal';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { PollListSkeleton } from '../components/common/Skeleton';
import { PlusCircle, Search, Filter } from 'lucide-react';

export function MyPollsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'closed'
  const [activeSharePoll, setActiveSharePoll] = useState(null);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const data = await pollService.getUserPolls();
      setPolls(data || []);
    } catch (err) {
      toast.error('Failed to load your polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleClosePoll = async (pollId) => {
    try {
      await pollService.closePoll(pollId);
      toast.success('Poll closed');
      fetchPolls();
    } catch (err) {
      toast.error(err.message || 'Failed to close poll');
    }
  };

  const handleDeletePoll = async (pollId) => {
    try {
      await pollService.deletePoll(pollId);
      toast.success('Poll deleted');
      fetchPolls();
    } catch (err) {
      toast.error(err.message || 'Failed to delete poll');
    }
  };

  const filteredPolls = polls.filter((p) => {
    const matchesSearch = p.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.status === 'active') ||
      (statusFilter === 'closed' && p.status === 'closed');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">My Polls</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Manage your questions, view live responses, and inspect audience statistics.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/polls/create')}
          leftIcon={PlusCircle}
          className="self-start sm:self-auto"
        >
          Create Poll
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200/80">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search polls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-indigo-600 min-h-[40px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['all', 'active', 'closed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors min-h-[36px] ${
                statusFilter === filter
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Polls Listing */}
      {loading ? (
        <PollListSkeleton />
      ) : filteredPolls.length === 0 ? (
        <EmptyState
          title={polls.length === 0 ? "You haven't created any polls yet." : "No matching polls found"}
          description={
            polls.length === 0
              ? "Create your first poll now to start gathering audience opinions in real time."
              : "Try adjusting your search terms or status filter."
          }
          actionText={polls.length === 0 ? "Create your first poll" : null}
          onAction={polls.length === 0 ? () => navigate('/polls/create') : null}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPolls.map((poll) => (
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

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(activeSharePoll)}
        onClose={() => setActiveSharePoll(null)}
        poll={activeSharePoll}
      />
    </div>
  );
}

export default MyPollsPage;
