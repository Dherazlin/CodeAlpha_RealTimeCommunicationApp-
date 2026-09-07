import React from 'react';
import VideoTile from './VideoTile';
import EmptyState from '../common/EmptyState';
import { Users } from 'lucide-react';

export default function VideoGrid({ participants = [] }) {
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

  // Compute optimal grid layout based on participant count
  const getGridClasses = () => {
    if (count === 1) return 'grid-cols-1 max-w-3xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl';
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex items-center justify-center">
      <div className={`grid w-full gap-3 sm:gap-4 h-full max-h-[calc(100vh-140px)] ${getGridClasses()}`}>
        {participants.map((participant) => (
          <VideoTile
            key={participant.id}
            participant={participant}
            isSelf={participant.isSelf}
          />
        ))}
      </div>
    </div>
  );
}
