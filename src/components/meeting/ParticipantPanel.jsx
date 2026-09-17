import React, { useState } from 'react';
import { X, Search, Mic, MicOff, Video, VideoOff, Crown, Users } from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';

export default function ParticipantPanel({
  isOpen,
  onClose,
  participants = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      role="region"
      aria-label="Meeting Participants Panel"
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Participants ({participants.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Close participants panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            aria-label="Filter participants"
          />
        </div>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 dark-scroll">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No participants found"
            description={
              searchQuery
                ? `No participant matching "${searchQuery}"`
                : 'No participants currently in room.'
            }
            className="bg-transparent border-slate-800 text-slate-400 py-6"
          />
        ) : (
          filtered.map((participant) => {
            const cleanName = participant.name
              ? participant.name.replace(/\s*\(You\)$/, '')
              : 'Participant';

            return (
              <div
                key={participant.socketId || participant.userId || participant.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={participant.avatar}
                    name={cleanName}
                    initials={participant.initials}
                    size="sm"
                    isSpeaking={participant.isSpeaking}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {cleanName}
                      </span>
                      {participant.isSelf && (
                        <span className="text-[11px] font-normal text-slate-400 shrink-0">
                          (You)
                        </span>
                      )}
                      {participant.isHost && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Host" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {participant.isHost
                        ? 'Host'
                        : participant.role || (participant.isSelf ? 'Member' : 'Participant')}
                    </span>
                  </div>
                </div>

                {/* Status Icons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`p-1 rounded-md ${
                      participant.isMicOn ? 'text-slate-400' : 'text-rose-400 bg-rose-500/10'
                    }`}
                    title={participant.isMicOn ? 'Mic On' : 'Mic Muted'}
                  >
                    {participant.isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`p-1 rounded-md ${
                      participant.isCameraOn ? 'text-slate-400' : 'text-rose-400 bg-rose-500/10'
                    }`}
                    title={participant.isCameraOn ? 'Camera On' : 'Camera Off'}
                  >
                    {participant.isCameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center shrink-0">
        Real-time participant presence powered by Socket.io
      </div>
    </div>
  );
}
