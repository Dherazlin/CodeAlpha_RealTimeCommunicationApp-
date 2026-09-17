import React from 'react';
import VideoTile from './VideoTile';
import EmptyState from '../common/EmptyState';
import { Users } from 'lucide-react';

export default function VideoGrid({
  participants = [],
  localStream = null,
  remoteStreams = {},
  peerStates = {},
}) {
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

  const count = participants.length;

  // Dynamic grid layout matching participant count (1, 2, 3-4, 5-6)
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
