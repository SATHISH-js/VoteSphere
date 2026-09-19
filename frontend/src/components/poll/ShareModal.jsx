import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import siteConfig from '../../config/siteConfig';
import { Copy, Check, Share2, QrCode, ExternalLink, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function ShareModal({ isOpen, onClose, poll }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!poll) return null;

  const pollUrl = poll.publicUrl || `${window.location.origin}/poll/${poll.slug || poll.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vote on: ${poll.question}`,
          text: `Cast your vote on ${siteConfig.name}: ${poll.question}`,
          url: pollUrl,
        });
      } catch (e) {
        // User canceled or failed
      }
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Cast your vote on ${siteConfig.name}: "${poll.question}"\n${pollUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share Live Poll — ${siteConfig.name}`} maxWidth="max-w-md">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Poll Question
          </p>
          <p className="text-sm font-semibold text-zinc-900 leading-snug">{poll.question}</p>
        </div>

        {/* Link Copy Box */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Public Voting Link
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              type="text"
              readOnly
              value={pollUrl}
              className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-700 select-all focus:outline-none min-h-[44px]"
            />
            <Button
              size="sm"
              variant={copied ? 'secondary' : 'primary'}
              onClick={handleCopy}
              leftIcon={copied ? Check : Copy}
              className="shrink-0 min-h-[44px]"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            leftIcon={MessageCircle}
            className="text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 min-h-[40px]"
          >
            WhatsApp
          </Button>

          {navigator.share ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNativeShare}
              leftIcon={Share2}
              className="min-h-[40px]"
            >
              Share...
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(pollUrl, '_blank')}
              leftIcon={ExternalLink}
              className="min-h-[40px]"
            >
              Open Link
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(!showQR)}
            leftIcon={QrCode}
            className="col-span-2 sm:col-span-1 min-h-[40px]"
          >
            {showQR ? 'Hide QR' : 'QR Code'}
          </Button>
        </div>

        {/* QR Code Container */}
        {showQR && (
          <div className="mt-4 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-center animate-in fade-in duration-200">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-zinc-200">
              <QRCodeSVG
                value={pollUrl}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-700">Scan with mobile camera to vote</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Instant live response • No app download</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ShareModal;
