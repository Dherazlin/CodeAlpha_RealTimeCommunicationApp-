import React, { useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, VideoOff, Crown, WifiOff, Loader2 } from 'lucide-react';
import Avatar from '../common/Avatar';

/**
 * VideoTile — renders one participant's video, audio, and status overlays.
 *
 * Audio fix (Phase 1):
 *   A hidden <audio> element always handles remote audio independently of camera state.
 *   This prevents audio from being silenced when the remote camera is off.
 *
 * srcObject fix (Phase 1):
 *   We use a ref-callback pattern (`ref={(el) => { if (el && el.srcObject !== stream) el.srcObject = stream; }}`)
 *   so the DOM element receives the stream on mount and on every distinct stream reference change,
 *   even if React's reference-equality check would normally skip the effect.
 */
export default function VideoTile({
  participant,
  stream,
  peerState = 'connected',
  isSelf = false,
}) {
  const { name, avatar, initials, isHost, isMicOn, isCameraOn, isSpeaking } = participant;

  // Dedicated audio element ref — always mounted, never conditional, so remote audio is never cut off
  const audioRef = useRef(null);

  // Attach remote audio stream to the <audio> element whenever the stream changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el || isSelf) return;
    if (stream && el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch((err) => {
        // Autoplay policy may block — this is fine; user interaction will unblock it
        console.warn('[VideoTile] audio.play() blocked by autoplay policy:', err.name);
      });
    } else if (!stream) {
      el.srcObject = null;
    }
  }, [stream, isSelf]);

  const hasVideoStream = Boolean(
    stream &&
      stream.getVideoTracks &&
      stream.getVideoTracks().filter((t) => t.readyState === 'live').length > 0 &&
      isCameraOn
  );

  /**
   * Ref callback for the <video> element.
   * Guarantees srcObject is assigned on every mount and on every distinct stream reference,
   * even when React's shallow-equality check would skip a useEffect.
   */
  const videoRefCallback = useCallback(
    (el) => {
      if (!el) return;
      if (el.srcObject !== stream) {
        el.srcObject = stream || null;
      }
    },
    [stream]
  );

  return (
    <div
      className={`relative w-full h-full min-h-[200px] sm:min-h-[260px] md:min-h-[300px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border transition-all duration-200 flex items-center justify-center select-none shadow-md ${
        isSpeaking
          ? 'border-brand-500 ring-2 ring-brand-500/50 shadow-brand-500/10'
          : 'border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Hidden audio element — always mounted for remote participants so audio works when camera is off */}
      {!isSelf && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          className="hidden"
          aria-hidden="true"
        />
      )}

      {/* Video / Camera Feed Element */}
      {isCameraOn ? (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-950">
          {hasVideoStream ? (
            <video
              ref={videoRefCallback}
              autoPlay
              playsInline
              muted={isSelf}
              className={`w-full h-full object-cover ${isSelf ? 'scale-x-[-1]' : ''}`}
            />
          ) : avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover opacity-90 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
              <Avatar
                name={name}
                initials={initials}
                size="2xl"
                isSpeaking={isSpeaking}
                className="shadow-xl ring-4 ring-white dark:ring-slate-800"
              />
            </div>
          )}
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 dark:from-slate-950/80 via-transparent to-transparent dark:to-slate-950/30 pointer-events-none" />
        </div>
      ) : (
        /* Camera Off Placeholder Avatar */
        <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="relative mb-3">
            <Avatar
              name={name}
              initials={initials}
              size="2xl"
              isSpeaking={isSpeaking}
              className="shadow-lg ring-4 ring-white dark:ring-slate-800"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-sm">
              <VideoOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Camera turned off</p>
        </div>
      )}

      {/* Speaking Pulse Badge */}
      {isSpeaking && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-semibold tracking-wide backdrop-blur-xs shadow-sm animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>Speaking</span>
        </div>
      )}

      {/* Connection State Badge (if not self and not fully connected) */}
      {!isSelf && (peerState === 'failed' || peerState === 'disconnected') && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-[10px] font-medium backdrop-blur-xs shadow-sm">
          <WifiOff className="w-3 h-3" />
          <span>Connection lost</span>
        </div>
      )}

      {!isSelf && peerState === 'connecting' && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/80 text-white text-[10px] font-medium backdrop-blur-xs shadow-sm">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Connecting...</span>
        </div>
      )}

      {/* Top Right Controls / Host Tag */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {isHost && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-300 text-[10px] font-semibold backdrop-blur-xs">
            <Crown className="w-3 h-3" />
            <span>Host</span>
          </div>
        )}
      </div>

      {/* Bottom Info Bar: Name + Mic Status */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs font-medium shadow-sm max-w-[85%]">
          <span className="truncate">
            {isSelf
              ? name.endsWith('(You)')
                ? name
                : `${name} (You)`
              : name.replace(/\s*\(You\)$/, '')}
          </span>
        </div>

        <div
          className={`p-1.5 rounded-lg backdrop-blur-md border shadow-sm ${
            isMicOn
              ? 'bg-white/90 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              : 'bg-rose-50 dark:bg-rose-500/90 border-rose-200 dark:border-rose-600 text-rose-600 dark:text-white'
          }`}
          title={isMicOn ? 'Microphone on' : 'Microphone muted'}
        >
          {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}
