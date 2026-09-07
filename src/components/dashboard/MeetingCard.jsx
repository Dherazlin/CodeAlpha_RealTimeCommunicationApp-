import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, Copy, Check, Users, ArrowRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function MeetingCard({ meeting, isRecent = false }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meeting.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    navigate(`/meeting/${meeting.id}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all duration-200 p-5 flex flex-col justify-between group">
      <div>
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant={meeting.isLive ? 'danger' : 'brand'}
            size="sm"
            className={meeting.isLive ? 'animate-pulse font-semibold' : ''}
          >
            {meeting.isLive ? '● Live Now' : meeting.category || 'Meeting'}
          </Badge>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 rounded-lg px-2 py-0.5 transition-colors"
            title="Copy meeting link"
            aria-label={`Copy meeting link for ${meeting.title}`}
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{meeting.id}</span>
          </button>
        </div>

        {/* Title & Description */}
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-1">
          {meeting.title}
        </h4>
        {meeting.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
            {meeting.description}
          </p>
        )}

        {/* Time metadata */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{meeting.time || meeting.date}</span>
          </div>
          {meeting.duration && (
            <span className="text-slate-400 text-[11px]">({meeting.duration})</span>
          )}
        </div>
      </div>

      {/* Footer: Participants & Join Action */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Avatar Stack */}
        <div className="flex items-center -space-x-2 overflow-hidden">
          {meeting.participants && meeting.participants.slice(0, 4).map((p, idx) => (
            <Avatar
              key={idx}
              src={p.avatar}
              name={p.name}
              initials={p.initials}
              size="xs"
              className="ring-2 ring-white"
            />
          ))}
          {meeting.participants && meeting.participants.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              +{meeting.participants.length - 4}
            </div>
          )}
          {meeting.participantsCount && (
            <div className="flex items-center gap-1 text-xs text-slate-500 pl-2">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{meeting.participantsCount} attended</span>
            </div>
          )}
        </div>

        {/* Join button */}
        <Button
          variant={meeting.isLive ? 'primary' : 'secondary'}
          size="sm"
          onClick={handleJoin}
          icon={isRecent ? ArrowRight : Video}
          iconPosition="right"
        >
          {isRecent ? 'Rejoin' : meeting.isLive ? 'Join Now' : 'Join'}
        </Button>
      </div>
    </div>
  );
}
