import React, { useState } from 'react';
import { Video, ShieldCheck, Wifi, Copy, Check, Users } from 'lucide-react';
import Badge from '../common/Badge';

export default function MeetingHeader({
  roomId,
  meetingTitle = 'Product Design Weekly Sync',
  participantCount = 1,
  connectionStatus = 'connected',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId || 'KOR-DEMO');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-14 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left: Brand & Meeting Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-xs">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-sm hidden sm:inline">Korus</span>
        </div>

        <div className="h-4 w-px bg-slate-700 hidden sm:block" />

        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-semibold text-slate-100 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {meetingTitle}
          </h1>
        </div>
      </div>

      {/* Middle: Room ID pill */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-xs font-mono text-slate-300 hover:text-white transition-colors"
          title="Click to copy Room Code"
          aria-label={`Copy room code ${roomId}`}
        >
          <span>{roomId}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Right: Connection & Security badges */}
      <div className="flex items-center gap-2.5">
        {/* Real-time Socket.io Connection status */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
            connectionStatus === 'connected'
              ? 'bg-slate-800/80 border-slate-700 text-slate-300'
              : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
              ? 'bg-amber-950/40 border-amber-800 text-amber-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
          title={`Socket.io Connection: ${connectionStatus}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-400'
                : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="capitalize">
            {connectionStatus === 'connected'
              ? 'Connected'
              : connectionStatus === 'connecting'
              ? 'Connecting...'
              : connectionStatus === 'reconnecting'
              ? 'Reconnecting...'
              : connectionStatus === 'error'
              ? 'Connection Error'
              : 'Disconnected'}
          </span>
        </div>

        {/* Mock encryption */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 font-medium"
          title="Demo Mock Encryption"
        >
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          <span>Mock Encrypted</span>
        </div>

        {/* Participants count pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-200 border border-slate-700 font-medium">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{participantCount}</span>
        </div>
      </div>
    </header>
  );
}
