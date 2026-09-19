import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  ScreenShare,
  ScreenShareOff,
  MoreVertical,
  PhoneOff,
  Paperclip,
  Pen,
} from 'lucide-react';

export default function MeetingControls({
  isMicOn,
  onToggleMic,
  isCameraOn,
  onToggleCamera,
  isParticipantsOpen,
  onToggleParticipants,
  participantCount = 1,
  isChatOpen,
  onToggleChat,
  hasUnreadChat = false,
  isFilePanelOpen,
  onToggleFilePanel,
  isWhiteboardOpen,
  onToggleWhiteboard,
  isScreenSharing = false,
  onStartScreenShare,
  onStopScreenShare,
  isMoreOpen,
  onToggleMore,
  onLeaveMeeting,
}) {
  const handleScreenShareClick = () => {
    if (isScreenSharing) {
      onStopScreenShare?.();
    } else {
      onStartScreenShare?.();
    }
  };

  return (
    <div className="h-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left filler for centering alignment on desktop */}
      <div className="hidden md:flex items-center gap-2 w-40">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Controls</span>
      </div>

      {/* Center Controls Bar */}
      <div className="flex items-center gap-2 sm:gap-3 mx-auto">
        {/* Microphone Toggle */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
            isMicOn
              ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-slate-400'
              : 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white focus:ring-rose-500 shadow-sm'
          }`}
          aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          <span className="hidden sm:inline">{isMicOn ? 'Mute' : 'Unmuted'}</span>
        </button>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
            isCameraOn
              ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-slate-400'
              : 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white focus:ring-rose-500 shadow-sm'
          }`}
          aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          <span className="hidden sm:inline">{isCameraOn ? 'Stop Video' : 'Start Video'}</span>
        </button>

        <div className="h-6 w-px bg-slate-300 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Screen Share Toggle */}
        <button
          type="button"
          id="screen-share-btn"
          onClick={handleScreenShareClick}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
            isScreenSharing
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm ring-2 ring-brand-500/40'
              : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white focus:ring-slate-400'
          }`}
          aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}
          title={isScreenSharing ? 'Stop sharing your screen' : 'Share your screen'}
        >
          {isScreenSharing ? (
            <ScreenShareOff className="w-5 h-5" />
          ) : (
            <ScreenShare className="w-5 h-5" />
          )}
          <span className="hidden md:inline">
            {isScreenSharing ? 'Stop Sharing' : 'Share'}
          </span>
        </button>

        {/* Participants Panel Toggle */}
        <button
          type="button"
          onClick={onToggleParticipants}
          className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
            isParticipantsOpen
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label={`Participants (${participantCount})`}
        >
          <Users className="w-5 h-5" />
          <span className="hidden md:inline">Participants</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5 ${
            isParticipantsOpen ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {participantCount}
          </span>
        </button>

        {/* Chat Panel Toggle */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`relative flex items-center justify-center p-2.5 sm:p-3 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
            isChatOpen
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label="Toggle chat"
          title="Chat"
        >
          <MessageSquare className="w-5 h-5 sm:w-5 sm:h-5" />
          {hasUnreadChat && !isChatOpen && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-900 rounded-full animate-pulse" />
          )}
        </button>

        {/* File Share Toggle */}
        <button
          type="button"
          onClick={onToggleFilePanel}
          className={`relative flex items-center justify-center p-2.5 sm:p-3 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
            isFilePanelOpen
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label="Toggle shared files"
          title="Shared Files"
        >
          <Paperclip className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>

        {/* Whiteboard Toggle */}
        <button
          type="button"
          onClick={onToggleWhiteboard}
          className={`relative flex items-center justify-center p-2.5 sm:p-3 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
            isWhiteboardOpen
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label="Toggle Whiteboard"
          title="Whiteboard"
        >
          <Pen className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>

        {/* More Options Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleMore}
            className={`p-2.5 sm:p-2.5 rounded-xl text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
              isMoreOpen
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
            }`}
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Leave Button */}
      <div className="flex items-center justify-end w-auto sm:w-40">
        <button
          type="button"
          onClick={onLeaveMeeting}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-rose-500 dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          aria-label="Leave meeting"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </div>
  );
}
