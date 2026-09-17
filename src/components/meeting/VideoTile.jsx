import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, VideoOff, Crown } from 'lucide-react';
import Avatar from '../common/Avatar';

export default function VideoTile({ participant, stream, isSelf = false }) {
  const { name, avatar, initials, isHost, isMicOn, isCameraOn, isSpeaking } = participant;
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraOn]);

  const hasVideoStream = Boolean(stream && stream.getVideoTracks && stream.getVideoTracks().length > 0);

  return (
    <div
      className={`relative w-full h-full min-h-[200px] sm:min-h-[260px] md:min-h-[300px] rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-200 flex items-center justify-center select-none shadow-md ${
        isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/10'
          : 'border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* Video / Camera Feed Element */}
      {isCameraOn ? (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
          {hasVideoStream ? (
            <video
              ref={videoRef}
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
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
              <Avatar
                name={name}
                initials={initials}
                size="2xl"
                isSpeaking={isSpeaking}
                className="shadow-xl ring-4 ring-slate-800"
              />
            </div>
          )}
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />
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
              className="shadow-lg ring-4 ring-slate-800"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 shadow-sm">
              <VideoOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400">Camera turned off</p>
        </div>
      )}

      {/* Speaking Pulse Badge */}
      {isSpeaking && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-semibold tracking-wide backdrop-blur-xs shadow-sm animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>Speaking</span>
        </div>
      )}

      {/* Top Right Controls / Host Tag */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {isHost && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-semibold backdrop-blur-xs">
            <Crown className="w-3 h-3" />
            <span>Host</span>
          </div>
        )}
      </div>

      {/* Bottom Info Bar: Name + Mic Status */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-xs font-medium shadow-sm max-w-[85%]">
          <span className="truncate">{isSelf ? `${name} (You)` : name}</span>
        </div>

        <div
          className={`p-1.5 rounded-lg backdrop-blur-md border shadow-sm ${
            isMicOn
              ? 'bg-slate-950/80 border-slate-800 text-slate-300'
              : 'bg-rose-500/90 border-rose-600 text-white'
          }`}
          title={isMicOn ? 'Microphone on' : 'Microphone muted'}
        >
          {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}
