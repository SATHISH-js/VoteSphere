import React, { useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Dropdown from '../common/Dropdown';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import {
  ExternalLink,
  Share2,
  BarChart2,
  Lock,
  Trash2,
  CheckCircle2,
  Clock,
  PieChart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PollCard({ poll, onShare, onClosePoll, onDeletePoll }) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const isClosed = poll.status === 'closed';

  const menuItems = [
    {
      label: 'View Voting Page',
      icon: ExternalLink,
      onClick: () => window.open(`/poll/${poll.slug || poll.id}`, '_blank'),
    },
    {
      label: 'Live Results',
      icon: BarChart2,
      onClick: () => navigate(`/poll/${poll.slug || poll.id}/results`),
    },
    {
      label: 'Detailed Analytics',
      icon: PieChart,
      onClick: () => navigate(`/polls/${poll.id}/analytics`),
    },
    {
      label: 'Share Poll',
      icon: Share2,
      onClick: () => onShare(poll),
    },
    { divider: true },
    !isClosed
      ? {
          label: 'Close Poll',
          icon: Lock,
          onClick: () => setShowCloseConfirm(true),
        }
      : null,
    {
      label: 'Delete Poll',
      icon: Trash2,
      danger: true,
      onClick: () => setShowDeleteConfirm(true),
    },
  ].filter(Boolean);

  return (
    <>
      <Card className="p-5 flex flex-col justify-between hover:border-zinc-300 transition-all">
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <Badge variant={isClosed ? 'zinc' : 'emerald'}>
              {isClosed ? 'Closed' : 'Active'}
            </Badge>

            <Dropdown items={menuItems} />
          </div>

          <h3
            onClick={() => navigate(`/poll/${poll.slug || poll.id}/results`)}
            className="text-base font-semibold text-zinc-900 line-clamp-2 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {poll.question}
          </h3>

          <p className="mt-2 text-xs text-zinc-500">
            {poll.options?.length || 0} options • Created {formatDate(poll.createdAt)}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <span>{poll.totalVotes || 0} votes</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onShare(poll)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/poll/${poll.slug || poll.id}/results`)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Results →
            </button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeletePoll(poll.id);
        }}
        title="Delete Poll?"
        message={`Are you sure you want to delete "${poll.question}"? All recorded votes will be permanently deleted.`}
      />

      {/* Close Poll Confirmation */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={() => {
          setShowCloseConfirm(false);
          onClosePoll(poll.id);
        }}
        isDanger={false}
        confirmText="Close Poll"
        title="Close Poll?"
        message="Audience members will no longer be able to submit new votes. Existing results will remain visible."
      />
    </>
  );
}

export default PollCard;
