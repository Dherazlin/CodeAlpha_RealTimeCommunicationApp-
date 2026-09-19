import React, { useEffect, useRef } from 'react';
import VideoTile from './VideoTile';
import EmptyState from '../common/EmptyState';
import { Users, Monitor, ScreenShareOff, Loader2 } from 'lucide-react';

export default function VideoGrid({
  participants = [],
  localStream = null,
  remoteStreams = {},
  peerStates = {},
  screenShareStream = null,
  screenSharingParticipant = null,
  isScreenSharing = false,
  onStopScreenShare = null,
}) {
  const presentationVideoRef = useRef(null);

  const isSharingActive = Boolean(screenSharingParticipant || isScreenSharing || screenShareStream);

  const isSelfSharing = Boolean(
    isScreenSharing ||
      (screenSharingParticipant &&
        (screenSharingParticipant.isSelf ||
          screenSharingParticipant.socketId === 'local_pending' ||
          participants.find((p) => p.isSelf && p.socketId === screenSharingParticipant.socketId)))
  );

  const presenterSocketId = screenSharingParticipant?.socketId;
  const presentationStream = isSelfSharing
    ? screenShareStream
    : presenterSocketId
    ? remoteStreams[presenterSocketId]
    : null;

  const presenterName = isSelfSharing
    ? 'You'
    : screenSharingParticipant?.userName ||
      screenSharingParticipant?.name ||
      participants.find((p) => p.socketId === presenterSocketId)?.name ||
      'Presenter';

  // Attach presentation stream to video element
  useEffect(() => {
    if (presentationVideoRef.current && presentationStream) {
      presentationVideoRef.current.srcObject = presentationStream;
    }
  }, [presentationStream]);

  if (!participants || participants.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          icon={Users}
          title="No participants in meeting"
          description="Waiting for others to join. Share your room link with teammates."
          className="bg-slate-900 border-slate-800 text-slate-300"
        />
      </div>
    );
  }

  // --- SCREEN SHARING PRESENTATION LAYOUT ---
  if (isSharingActive) {
    return (
      <div className="flex-1 flex flex-col min-h-0 w-full h-full p-2 sm:p-4 gap-2 sm:gap-3 overflow-hidden">
        {/* Main Featured Presentation Stage */}
        <div className="flex-1 min-h-0 relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 shadow-2xl flex items-center justify-center select-none">
          {presentationStream ? (
            <video
              ref={presentationVideoRef}
              autoPlay
              playsInline
              muted={isSelfSharing}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-slate-200 text-sm font-semibold">
                Connecting to {presenterName}&apos;s screen...
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                WebRTC media track negotiation in progress.
              </p>
            </div>
          )}

          {/* Top-Left Presentation Info Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-white text-xs font-semibold backdrop-blur-md shadow-md">
            <Monitor className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-[300px]">
              {isSelfSharing ? 'You are sharing your screen' : `${presenterName}'s screen`}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          </div>

          {/* Top-Right Stop Button (for self sharer) */}
          {isSelfSharing && onStopScreenShare && (
            <button
              type="button"
              id="stop-presentation-top-btn"
              onClick={onStopScreenShare}
              className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold backdrop-blur-md shadow-lg transition-all duration-150 cursor-pointer active:scale-95"
            >
              <ScreenShareOff className="w-3.5 h-3.5" />
              <span>Stop Sharing</span>
            </button>
          )}

          {/* Bottom subtle indicator */}
          <div className="absolute bottom-3 left-3 z-20 text-[10px] text-slate-400/80 px-2.5 py-1 rounded-md bg-slate-950/70 backdrop-blur-xs border border-slate-800/60 pointer-events-none">
            Screen Share (WebRTC)
          </div>
        </div>

        {/* Bottom Horizontal Participant Strip */}
        <div className="h-32 sm:h-40 shrink-0 flex items-center gap-2.5 overflow-x-auto overflow-y-hidden px-1 pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-800">
          {participants.map((participant) => {
            const isPresenter =
              (isSelfSharing && participant.isSelf) ||
              (!isSelfSharing && participant.socketId === presenterSocketId);

            // For remote presenter, hide camera video in thumbnail strip so it doesn't show duplicate screen
            const adjustedParticipant =
              isPresenter && !participant.isSelf
                ? { ...participant, isCameraOn: false }
                : participant;

            const stream = participant.isSelf
              ? localStream
              : remoteStreams[participant.socketId] || null;

            const peerState = participant.isSelf
              ? 'connected'
              : peerStates[participant.socketId] || 'connecting';

            return (
              <div
                key={participant.socketId || participant.id}
                className="h-full w-44 sm:w-56 shrink-0"
              >
                <VideoTile
                  participant={adjustedParticipant}
                  stream={isPresenter && !participant.isSelf ? null : stream}
                  peerState={peerState}
                  isSelf={participant.isSelf}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- STANDARD GRID LAYOUT (NO SCREEN SHARING) ---
  const count = participants.length;

  const getGridClasses = () => {
    if (count === 1) return 'grid-cols-1 max-w-4xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl';
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex items-center justify-center">
      <div className={`grid w-full gap-3 sm:gap-4 h-full max-h-[calc(100vh-140px)] ${getGridClasses()}`}>
        {participants.map((participant) => {
          const stream = participant.isSelf
            ? localStream
            : remoteStreams[participant.socketId] || null;

          const peerState = participant.isSelf
            ? 'connected'
            : peerStates[participant.socketId] || 'connecting';

          return (
            <VideoTile
              key={participant.socketId || participant.id}
              participant={participant}
              stream={stream}
              peerState={peerState}
              isSelf={participant.isSelf}
            />
          );
        })}
      </div>
    </div>
  );
}
