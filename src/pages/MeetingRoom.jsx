import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MeetingHeader from '../components/meeting/MeetingHeader';
import VideoGrid from '../components/meeting/VideoGrid';
import MeetingControls from '../components/meeting/MeetingControls';
import ParticipantPanel from '../components/meeting/ParticipantPanel';
import ChatPanel from '../components/meeting/ChatPanel';
import MoreMenu from '../components/meeting/MoreMenu';
import ScreenShareModal from '../components/meeting/ScreenShareModal';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import {
  mockParticipantsInRoom,
  mockChatMessages as initialMessages,
  upcomingMeetings,
  recentMeetings,
} from '../data/mockData';
import { PhoneOff, Settings, Info, Copy, Check, ShieldCheck } from 'lucide-react';

export default function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const matchedMeeting =
    upcomingMeetings.find((m) => m.id === roomId) ||
    recentMeetings.find((m) => m.id === roomId);
  const meetingTitle =
    location.state?.title ||
    matchedMeeting?.title ||
    (roomId ? `Meeting ${roomId}` : 'Meeting Room');

  // Compute initials
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'YOU';

  // Initialize room participants with authenticated user info for self tile
  const [participants, setParticipants] = useState(() =>
    mockParticipantsInRoom.map((p) =>
      p.isSelf
        ? {
            ...p,
            name: user?.name ? `${user.name} (You)` : 'You',
            initials: userInitials,
            avatar: user?.avatar || p.avatar,
          }
        : p
    )
  );

  const [messages, setMessages] = useState(initialMessages);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isScreenShareOpen, setIsScreenShareOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [copiedInfo, setCopiedInfo] = useState(false);

  // Toggle local self microphone state
  const handleToggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    setParticipants((prev) =>
      prev.map((p) => (p.isSelf ? { ...p, isMicOn: nextState } : p))
    );
  };

  // Toggle local self camera state
  const handleToggleCamera = () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    setParticipants((prev) =>
      prev.map((p) => (p.isSelf ? { ...p, isCameraOn: nextState } : p))
    );
  };

  // Toggle Participant drawer
  const handleToggleParticipants = () => {
    setIsParticipantsOpen((prev) => !prev);
    if (!isParticipantsOpen) setIsChatOpen(false); // Clean one-at-a-time drawer on smaller screens
  };

  // Toggle Chat drawer
  const handleToggleChat = () => {
    setIsChatOpen((prev) => !prev);
    if (!isChatOpen) setIsParticipantsOpen(false);
  };

  // Send a new mock chat message (local React state)
  const handleSendMessage = (text) => {
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'You',
      initials: userInitials,
      avatar: user?.avatar || '',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Leave meeting confirm
  const handleConfirmLeave = () => {
    setIsLeaveModalOpen(false);
    navigate('/dashboard');
  };

  const handleCopyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedInfo(true);
    setTimeout(() => setCopiedInfo(false), 2000);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col justify-between overflow-hidden relative selection:bg-brand-500 selection:text-white">
      {/* Top Meeting Header */}
      <MeetingHeader
        roomId={roomId || 'KOR-ROOM'}
        meetingTitle={meetingTitle}
        participantCount={participants.length}
      />

      {/* Main Video Grid Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <VideoGrid participants={participants} />

        {/* Slide-out Participant Panel */}
        <ParticipantPanel
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          participants={participants}
        />

        {/* Slide-out Chat Panel */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* More Options Popup Menu */}
      <MoreMenu
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenInfo={() => setIsInfoModalOpen(true)}
      />

      {/* Bottom Floating/Centered Meeting Controls Toolbar */}
      <MeetingControls
        isMicOn={isMicOn}
        onToggleMic={handleToggleMic}
        isCameraOn={isCameraOn}
        onToggleCamera={handleToggleCamera}
        isParticipantsOpen={isParticipantsOpen}
        onToggleParticipants={handleToggleParticipants}
        participantCount={participants.length}
        isChatOpen={isChatOpen}
        onToggleChat={handleToggleChat}
        hasUnreadChat={false}
        onOpenScreenShare={() => setIsScreenShareOpen(true)}
        isMoreOpen={isMoreOpen}
        onToggleMore={() => setIsMoreOpen((prev) => !prev)}
        onLeaveMeeting={() => setIsLeaveModalOpen(true)}
      />

      {/* Screen Share Preview Modal (Adhering to strict Phase 1 rules) */}
      <ScreenShareModal
        isOpen={isScreenShareOpen}
        onClose={() => setIsScreenShareOpen(false)}
      />

      {/* Leave Meeting Confirmation Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Leave this meeting?"
        description="Are you sure you want to exit? You can rejoin anytime using the room code."
        maxWidth="max-w-sm"
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLeaveModalOpen(false)}
          >
            Stay in Call
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={PhoneOff}
            onClick={handleConfirmLeave}
          >
            Leave Meeting
          </Button>
        </div>
      </Modal>

      {/* Audio & Video Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Audio & Video Settings (Preview)"
        description="Hardware devices and noise suppression will be configurable in Phase 2."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Microphone Device
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-700"
              disabled
            >
              <option>Default - Built-in Microphone (Simulated)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Camera Device
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-700"
              disabled
            >
              <option>Default - HD Web Camera (Simulated)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
            Real device enumeration using <code className="text-brand-600">navigator.mediaDevices.enumerateDevices()</code> will be implemented in Phase 2.
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSettingsModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Meeting Information Modal */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Meeting Information"
        description="Share this link to invite team members into this session."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Meeting Room
              </span>
              <span className="font-semibold text-slate-900 text-sm">{meetingTitle}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Room Code
              </span>
              <span className="font-mono text-xs text-brand-600 font-bold">{roomId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600"
            />
            <Button
              variant="primary"
              size="sm"
              icon={copiedInfo ? Check : Copy}
              onClick={handleCopyMeetingLink}
            >
              {copiedInfo ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
