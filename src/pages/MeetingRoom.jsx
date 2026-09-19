import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MeetingHeader from '../components/meeting/MeetingHeader';
import VideoGrid from '../components/meeting/VideoGrid';
import MeetingControls from '../components/meeting/MeetingControls';
import ParticipantPanel from '../components/meeting/ParticipantPanel';
import ChatPanel from '../components/meeting/ChatPanel';
import FilePanel from '../components/meeting/FilePanel';
import Whiteboard from '../components/meeting/Whiteboard';
import MoreMenu from '../components/meeting/MoreMenu';
import ScreenShareModal from '../components/meeting/ScreenShareModal';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import LoadingScreen from '../components/common/LoadingScreen';
import { useAuth } from '../context/AuthContext';
import { createMeetingSocket } from '../utils/socket';
import { useWebRTC } from '../hooks/useWebRTC';
import { meetingApi } from '../utils/api';
import { PhoneOff, Settings, Info, Copy, Check, Users, AlertCircle, LogOut, ArrowLeft } from 'lucide-react';

export default function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();

  const cleanRoomId = (roomId || '').trim().toUpperCase();

  // Meeting Metadata from MongoDB
  const [meetingData, setMeetingData] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [meetingError, setMeetingError] = useState('');

  // Fetch meeting metadata on mount
  useEffect(() => {
    let isMounted = true;
    if (!cleanRoomId) {
      setMeetingError('Invalid Room ID');
      setMeetingLoading(false);
      return;
    }

    const fetchMeeting = async () => {
      try {
        setMeetingLoading(true);
        const res = await meetingApi.getMeeting(cleanRoomId);
        if (isMounted) {
          if (res.success && res.meeting) {
            setMeetingData(res.meeting);
            if (res.meeting.status === 'ended') {
              setMeetingError('This meeting has ended and is no longer active.');
            }
          } else {
            setMeetingError(res.message || 'Meeting not found');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[MeetingRoom] Failed to fetch meeting metadata:', err);
          setMeetingError(err.message || 'Meeting not found or network error');
        }
      } finally {
        if (isMounted) setMeetingLoading(false);
      }
    };

    fetchMeeting();

    return () => {
      isMounted = false;
    };
  }, [cleanRoomId]);

  const meetingTitle =
    location.state?.title ||
    meetingData?.title ||
    (cleanRoomId ? `Meeting ${cleanRoomId}` : 'Meeting Room');

  const isUserHost = Boolean(
    meetingData &&
      meetingData.host &&
      ((typeof meetingData.host === 'object' &&
        (meetingData.host._id === user?.id || meetingData.host.id === user?.id)) ||
        meetingData.host === user?.id)
  );

  // Compute initials for authenticated user
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'YOU';

  // Real-time states
  const [activeSocket, setActiveSocket] = useState(null);
  const [participants, setParticipants] = useState(() => [
    {
      id: user?.id || 'usr_local',
      userId: user?.id,
      socketId: 'local_pending',
      name: user?.name || 'You',
      email: user?.email || '',
      initials: userInitials,
      avatar: user?.avatar || '',
      role: 'Participant',
      isHost: false,
      isSelf: true,
      isMicOn: true,
      isCameraOn: true,
      isSpeaking: false,
    },
  ]);

  const [messages, setMessages] = useState([]);
  const [socketConnectionStatus, setSocketConnectionStatus] = useState('connecting');
  const [notification, setNotification] = useState(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // Sync authenticated user context into local participant entry if updated
  useEffect(() => {
    if (!user) return;
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.isSelf && (p.socketId === 'local_pending' || !p.name || p.name === 'You')) {
          return {
            ...p,
            id: user.id || p.id,
            userId: user.id || p.userId,
            name: user.name || p.name,
            email: user.email || p.email,
            avatar: user.avatar || p.avatar,
            initials: user.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : p.initials,
          };
        }
        return p;
      })
    );
  }, [user]);

  // Modals and Drawers
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFilePanelOpen, setIsFilePanelOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [screenSharingParticipant, setScreenSharingParticipant] = useState(null);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [screenShareError, setScreenShareError] = useState(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [copiedInfo, setCopiedInfo] = useState(false);

  // Socket reference
  const socketRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Show subtle toast notification
  const showNotification = useCallback((text) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(text);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // WebRTC Hook for Multi-Peer Mesh Audio & Video (2–6 participants)
  const {
    localStream,
    remoteStreams,
    peerStates,
    isMicOn,
    isCameraOn,
    isMediaReady,
    permissionStatus,
    permissionError,
    isScreenSharing,
    initLocalMedia,
    initiateOffer,
    attachSignalingListeners,
    closePeerConnection,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    cleanup: cleanupWebRTC,
  } = useWebRTC({
    socket: activeSocket,
    roomId: cleanRoomId,
    onNotification: showNotification,
  });

  // Stable refs for values accessed inside socket callbacks to avoid re-running the socket effect
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const isMicOnRef = useRef(isMicOn);
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  const isCameraOnRef = useRef(isCameraOn);
  useEffect(() => {
    isCameraOnRef.current = isCameraOn;
  }, [isCameraOn]);

  // Socket.io Lifecycle & Real-Time Presence
  useEffect(() => {
    if (!token || !cleanRoomId) {
      setSocketConnectionStatus('error');
      return;
    }

    setSocketConnectionStatus('connecting');
    const socket = createMeetingSocket(token);
    socketRef.current = socket;
    setActiveSocket(socket);

    // 1. Immediately attach WebRTC signaling listeners before connect/join-room
    attachSignalingListeners(socket);

    // 2. On connect, ensure local media is ready before emitting join-room
    socket.on('connect', async () => {
      console.log(`[MeetingRoom] Connected to Socket.io (${socket.id}). Ensuring local media readiness...`);
      setSocketConnectionStatus('connected');
      try {
        await initLocalMedia();
      } catch (err) {
        console.warn('[MeetingRoom] Media initialization error before join-room:', err);
      }
      console.log(`[MeetingRoom] Emitting join-room: ${cleanRoomId}`);
      socket.emit('join-room', { roomId: cleanRoomId });
    });

    // On connection error
    socket.on('connect_error', (error) => {
      console.warn('[MeetingRoom] Socket connection error:', error.message);
      setSocketConnectionStatus('error');
      showNotification(`Connection error: ${error.message}`);
    });

    // On disconnection
    socket.on('disconnect', (reason) => {
      console.log('[MeetingRoom] Socket disconnected:', reason);
      setSocketConnectionStatus('disconnected');
    });

    // Reconnection events
    socket.io.on('reconnect_attempt', () => {
      setSocketConnectionStatus('reconnecting');
    });

    socket.io.on('reconnect', async () => {
      console.log('[MeetingRoom] Reconnected. Rejoining room:', cleanRoomId);
      setSocketConnectionStatus('connected');
      try {
        await initLocalMedia();
      } catch (err) {
        console.warn('[MeetingRoom] Media initialization error on reconnect:', err);
      }
      socket.emit('join-room', { roomId: cleanRoomId });
    });

    // Receive initial room participants snapshot
    socket.on('room-users', ({ participants: roomUsers, screenSharer }) => {
      console.log('[MeetingRoom] Received room users snapshot:', roomUsers);
      if (screenSharer) {
        setScreenSharingParticipant(screenSharer);
      }
      setParticipants(
        roomUsers.map((p) => {
          const isSelf = p.socketId === socket.id;
          const currentUser = userRef.current;
          const displayName = isSelf && currentUser?.name ? currentUser.name : (p.name || 'Participant');
          return {
            ...p,
            id: p.userId || p.id,
            userId: p.userId || p.id,
            name: displayName,
            email: isSelf && currentUser?.email ? currentUser.email : p.email,
            avatar: isSelf && currentUser?.avatar ? currentUser.avatar : p.avatar,
            role: p.role || (p.isHost ? 'Host' : 'Participant'),
            isHost: Boolean(p.isHost),
            isSelf,
            initials: displayName
              ? displayName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'U',
            isMicOn: isSelf ? isMicOnRef.current : (p.isMicOn ?? true),
            isCameraOn: isSelf ? isCameraOnRef.current : (p.isCameraOn ?? true),
            isSpeaking: false,
          };
        })
      );
    });

    // Another participant joined the room -> existing user initiates WebRTC offer
    socket.on('participant-joined', async ({ participant }) => {
      console.log('[MeetingRoom] Participant joined room:', participant);
      if (participant.socketId === socket.id) return;

      setParticipants((prev) => {
        const exists = prev.some((p) => p.socketId === participant.socketId);
        if (exists) {
          return prev.map((p) =>
            p.socketId === participant.socketId
              ? {
                  ...p,
                  ...participant,
                  id: participant.userId || participant.id,
                  userId: participant.userId || participant.id,
                  name: participant.name,
                  isSelf: false,
                  initials: participant.name
                    ? participant.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U',
                }
              : p
          );
        }

        const newEntry = {
          ...participant,
          id: participant.userId || participant.id,
          userId: participant.userId || participant.id,
          name: participant.name,
          email: participant.email || '',
          avatar: participant.avatar || '',
          role: participant.role || (participant.isHost ? 'Host' : 'Participant'),
          isHost: Boolean(participant.isHost),
          isSelf: false,
          initials: participant.name
            ? participant.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : 'U',
          isMicOn: participant.isMicOn ?? true,
          isCameraOn: participant.isCameraOn ?? true,
          isSpeaking: false,
        };
        return [...prev, newEntry];
      });

      showNotification(`${participant.name} joined the meeting`);

      // Ensure local media has initialized before initiating offer
      await initLocalMedia();

      // Deterministic WebRTC negotiation: Existing participant initiates the offer to the newly joined peer
      console.log(`[MeetingRoom] Initiating WebRTC mesh offer to new participant: ${participant.socketId}`);
      initiateOffer(participant.socketId);
    });

    // A participant left the room -> clean up their peer connection and remove tile
    socket.on('participant-left', ({ socketId, userName }) => {
      console.log(`[MeetingRoom] Participant left (${socketId}): ${userName}`);
      closePeerConnection(socketId);
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      setScreenSharingParticipant((prev) => (prev && prev.socketId === socketId ? null : prev));
      if (userName) {
        showNotification(`${userName} left the meeting`);
      }
    });

    // Screen sharing started broadcast
    socket.on('screen-share-started', ({ socketId, userId, userName }) => {
      console.log('[MeetingRoom] Screen share started by:', socketId, userName);
      setScreenSharingParticipant({ socketId, userId, userName });
      if (socketRef.current && socketId !== socketRef.current.id) {
        showNotification(`${userName} started sharing their screen`);
      }
    });

    // Screen sharing stopped broadcast
    socket.on('screen-share-stopped', ({ socketId, userName }) => {
      console.log('[MeetingRoom] Screen share stopped:', socketId, userName);
      setScreenSharingParticipant((prev) => (prev && prev.socketId === socketId ? null : prev));
      setScreenShareStream(null);
      if (userName && socketRef.current && socketId !== socketRef.current.id) {
        showNotification(`${userName} stopped sharing their screen`);
      }
    });

    // Media toggle update from remote peer
    socket.on('user-toggle-media', ({ socketId, isMicOn: peerMic, isCameraOn: peerCam }) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === socketId) {
            return {
              ...p,
              isMicOn: typeof peerMic === 'boolean' ? peerMic : p.isMicOn,
              isCameraOn: typeof peerCam === 'boolean' ? peerCam : p.isCameraOn,
            };
          }
          return p;
        })
      );
    });

    // Real-time chat message broadcast received
    socket.on('receive-message', (msg) => {
      console.log('[MeetingRoom] Received chat message:', msg);
      const currentUser = userRef.current;
      const isSelf = msg.userId === currentUser?.id || (socketRef.current && msg.socketId === socketRef.current.id);

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;

        return [
          ...prev,
          {
            ...msg,
            sender: isSelf ? `${msg.userName} (You)` : msg.userName,
            initials: msg.userName
              ? msg.userName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'U',
            isSelf,
          },
        ];
      });

      if (!isSelf && !isChatOpenRef.current) {
        setHasUnreadChat(true);
      }
    });

    // File shared broadcast received
    socket.on('meeting-file-shared', ({ file }) => {
      console.log('[MeetingRoom] New file shared:', file);
      setSharedFiles((prev) => [file, ...prev]);
      showNotification(`${file.uploaderName} shared a file: ${file.originalName}`);
    });

    // Server error notification
    socket.on('error-message', ({ message }) => {
      console.warn('[MeetingRoom] Server error message:', message);
      showNotification(message);
    });

    // Meeting ended by host notification
    socket.on('meeting-ended', ({ message }) => {
      console.log('[MeetingRoom] Meeting ended by host:', message);
      showNotification(message || 'The host has ended this meeting.');
      cleanupWebRTC();
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    });

    // Connect socket now that all listeners are bound
    socket.connect();

    // Cleanup on unmount or room change
    return () => {
      console.log(`[MeetingRoom] Cleaning up socket connection for room: ${cleanRoomId}`);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      socket.emit('leave-room', { roomId: cleanRoomId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setActiveSocket(null);
    };
  }, [cleanRoomId, token, attachSignalingListeners, initiateOffer, closePeerConnection, cleanupWebRTC, initLocalMedia, showNotification, navigate]);

  // Keep self participant media state in sync with useWebRTC hook
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) => (p.isSelf ? { ...p, isMicOn, isCameraOn } : p))
    );
  }, [isMicOn, isCameraOn]);

  // Synchronize screen sharing state if sharing ends from browser native controls
  useEffect(() => {
    if (!isScreenSharing) {
      setScreenShareStream(null);
      setScreenSharingParticipant((prev) => {
        if (prev && (prev.isSelf || (socketRef.current && prev.socketId === socketRef.current.id))) {
          return null;
        }
        return prev;
      });
    }
  }, [isScreenSharing]);

  // Handle start screen sharing
  const handleStartScreenShare = async () => {
    try {
      const result = await startScreenShare();
      if (!result) return;

      if (result.success && result.stream) {
        setScreenShareStream(result.stream);
        setScreenSharingParticipant({
          socketId: socketRef.current?.id || 'local_pending',
          userId: user?.id,
          userName: user?.name || 'You',
          isSelf: true,
        });
        showNotification('You are sharing your screen');
      } else if (result.denied) {
        setScreenShareError(
          result.error || `${result.sharerName || 'Another participant'} is already sharing their screen.`
        );
      } else if (result.error) {
        showNotification(result.error);
      }
    } catch (err) {
      console.error('[MeetingRoom] Error in handleStartScreenShare:', err);
      showNotification('Unable to share screen.');
    }
  };

  const handleToggleWhiteboard = () => {
    const nextState = !isWhiteboardOpen;
    setIsWhiteboardOpen(nextState);
    if (nextState) {
      setIsParticipantsOpen(false);
      setIsChatOpen(false);
      setIsFilePanelOpen(false);
    }
  };

  // Handle stop screen sharing
  const handleStopScreenShare = () => {
    stopScreenShare();
    setScreenShareStream(null);
    setScreenSharingParticipant((prev) => {
      if (prev && (prev.isSelf || (socketRef.current && prev.socketId === socketRef.current.id))) {
        return null;
      }
      return prev;
    });
    showNotification('You stopped sharing your screen');
  };

  // Handle local microphone toggle
  const handleToggleMic = () => {
    toggleMic();
  };

  // Handle local camera toggle
  const handleToggleCamera = () => {
    toggleCamera();
  };

  // Toggle Participant drawer
  const handleToggleParticipants = () => {
    const nextState = !isParticipantsOpen;
    setIsParticipantsOpen(nextState);
    if (nextState) {
      setIsChatOpen(false);
      setIsFilePanelOpen(false);
      setIsWhiteboardOpen(false);
    }
  };

  // Toggle Chat drawer
  const handleToggleChat = () => {
    const nextState = !isChatOpen;
    setIsChatOpen(nextState);
    if (nextState) {
      setHasUnreadChat(false);
      setIsParticipantsOpen(false);
      setIsFilePanelOpen(false);
      setIsWhiteboardOpen(false);
    }
  };

  // Toggle File Panel drawer
  const handleToggleFilePanel = () => {
    const nextState = !isFilePanelOpen;
    setIsFilePanelOpen(nextState);
    if (nextState) {
      setIsParticipantsOpen(false);
      setIsChatOpen(false);
      setIsWhiteboardOpen(false);
      // Fetch files if empty (or always to refresh)
      if (sharedFiles.length === 0) {
        meetingApi.getFiles(cleanRoomId)
          .then((res) => {
            if (res.success) setSharedFiles(res.files);
          })
          .catch(err => console.error('Failed to load shared files:', err));
      }
    }
  };

  // Send real-time chat message via Socket.io
  const handleSendMessage = (text) => {
    if (!socketRef.current || !text.trim()) return;

    socketRef.current.emit('send-message', {
      roomId: cleanRoomId,
      message: text.trim(),
    });
  };

  // Leave meeting confirm (Participant leave)
  const handleConfirmLeave = () => {
    setIsLeaveModalOpen(false);
    cleanupWebRTC();
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId: cleanRoomId });
      socketRef.current.disconnect();
    }
    navigate('/dashboard');
  };

  // End meeting for everyone (Host only)
  const handleEndMeetingForAll = async () => {
    setIsLeaveModalOpen(false);
    try {
      if (socketRef.current) {
        socketRef.current.emit('end-meeting', { roomId: cleanRoomId });
      }
      await meetingApi.endMeeting(cleanRoomId);
    } catch (err) {
      console.error('Error ending meeting:', err);
    }
    cleanupWebRTC();
    navigate('/dashboard');
  };

  const handleCopyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedInfo(true);
    setTimeout(() => setCopiedInfo(false), 2000);
  };

  // Combined connection status for header
  const remotePeerCount = Object.keys(remoteStreams).length;
  const headerConnectionStatus =
    socketConnectionStatus === 'connected'
      ? remotePeerCount > 0
        ? 'connected'
        : 'connected'
      : socketConnectionStatus;

  if (meetingLoading) {
    return <LoadingScreen message="Connecting to meeting room..." />;
  }

  if (meetingError) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl dark:shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Unable to Join Meeting</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{meetingError}</p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              icon={ArrowLeft}
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-hidden relative selection:bg-brand-500 selection:text-white">
      {/* Top Meeting Header */}
      <MeetingHeader
        roomId={roomId || 'KOR-ROOM'}
        meetingTitle={meetingTitle}
        participantCount={participants.length}
        connectionStatus={headerConnectionStatus}
      />

      {/* Permission Denied / Device Warning Banner */}
      {permissionError && (
        <div
          className="mx-4 mt-2 px-3 py-2 bg-amber-950/80 border border-amber-800/80 text-amber-200 text-xs rounded-xl flex items-center justify-between z-30 shrink-0 animate-in fade-in"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{permissionError}</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline hover:text-white text-xs font-semibold ml-2 shrink-0"
          >
            Retry Permissions
          </button>
        </div>
      )}

      {/* Subtle Toast Notification Banner */}
      {notification && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/90 text-slate-800 dark:text-slate-100 text-xs px-4 py-2 rounded-full shadow-lg dark:shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full bg-brand-500 dark:bg-brand-400 animate-ping" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Screen Sharing Active Banner */}
      {screenSharingParticipant && (
        <div
          className="mx-4 mt-2 px-3.5 py-2 bg-brand-950/85 border border-brand-800/80 text-brand-200 text-xs rounded-xl flex items-center justify-between z-30 shrink-0 shadow-md backdrop-blur-md animate-in fade-in"
          role="status"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-medium truncate">
              {screenSharingParticipant.socketId === socketRef.current?.id || isScreenSharing
                ? 'You are presenting your screen to everyone in this meeting.'
                : `${screenSharingParticipant.userName || 'A participant'} is currently presenting their screen.`}
            </span>
          </div>
          {(screenSharingParticipant.socketId === socketRef.current?.id || isScreenSharing) && (
            <button
              type="button"
              onClick={handleStopScreenShare}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer ml-2 shrink-0 active:scale-95"
            >
              Stop Sharing
            </button>
          )}
        </div>
      )}

      {/* Main Video Grid Area with Real WebRTC Mesh Streams */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <VideoGrid
          participants={participants}
          localStream={localStream}
          remoteStreams={remoteStreams}
          peerStates={peerStates}
          screenShareStream={screenShareStream}
          screenSharingParticipant={screenSharingParticipant}
          isScreenSharing={isScreenSharing}
          onStopScreenShare={handleStopScreenShare}
        />

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

      {/* File Share Overlay / Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-40 transform transition-transform duration-300 ease-in-out md:static ${
          isFilePanelOpen ? 'translate-x-0' : 'translate-x-full md:hidden md:w-0'
        }`}
      >
        <FilePanel
          roomId={cleanRoomId}
          onClose={() => setIsFilePanelOpen(false)}
          sharedFiles={sharedFiles}
          onUploadComplete={(newFile) => {
             setSharedFiles((prev) => [newFile, ...prev]);
             socketRef.current?.emit('meeting-file-shared', { roomId: cleanRoomId, file: newFile });
          }}
        />
      </div>

      {/* Whiteboard Overlay */}
      {isWhiteboardOpen && (
        <Whiteboard 
          socket={activeSocket} 
          roomId={cleanRoomId} 
          onClose={() => setIsWhiteboardOpen(false)} 
        />
      )}

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
        hasUnreadChat={hasUnreadChat}
        isFilePanelOpen={isFilePanelOpen}
        onToggleFilePanel={handleToggleFilePanel}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleWhiteboard={handleToggleWhiteboard}
        isScreenSharing={isScreenSharing}
        onStartScreenShare={handleStartScreenShare}
        onStopScreenShare={handleStopScreenShare}
        isMoreOpen={isMoreOpen}
        onToggleMore={() => setIsMoreOpen((prev) => !prev)}
        onLeaveMeeting={() => setIsLeaveModalOpen(true)}
      />

      {/* Screen Share Error / Notice Dialog */}
      <ScreenShareModal
        isOpen={Boolean(screenShareError)}
        onClose={() => setScreenShareError(null)}
        message={screenShareError}
      />

      {/* Leave Meeting Confirmation Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={isUserHost ? "Host Meeting Controls" : "Leave this meeting?"}
        description={
          isUserHost
            ? "As the permanent Host, you can end this meeting for all participants or exit while keeping the meeting live."
            : "Are you sure you want to exit? You can rejoin anytime using the room code."
        }
        maxWidth="max-w-md"
      >
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLeaveModalOpen(false)}
          >
            Stay in Call
          </Button>

          {isUserHost ? (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={LogOut}
                onClick={handleConfirmLeave}
              >
                Leave Room Only
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={PhoneOff}
                onClick={handleEndMeetingForAll}
              >
                End Meeting for All
              </Button>
            </>
          ) : (
            <Button
              variant="danger"
              size="sm"
              icon={PhoneOff}
              onClick={handleConfirmLeave}
            >
              Leave Meeting
            </Button>
          )}
        </div>
      </Modal>

      {/* Audio & Video Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Audio & Video Settings"
        description="Hardware device selection and WebRTC media parameters."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Microphone Track
            </label>
            <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-mono text-[11px]">
              {localStream && localStream.getAudioTracks().length > 0
                ? localStream.getAudioTracks()[0].label || 'Default Microphone (Active)'
                : 'No Microphone Track Available'}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Camera Track
            </label>
            <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-mono text-[11px]">
              {localStream && localStream.getVideoTracks().length > 0
                ? localStream.getVideoTracks()[0].label || 'Default Camera (Active)'
                : 'No Camera Track Available'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">WebRTC Mesh Status</div>
            <div className="text-[11px]">
              Active Peer Connections: <span className="font-mono text-brand-600 font-bold">{remotePeerCount}</span>
            </div>
            {Object.entries(peerStates).map(([pSocketId, state]) => (
              <div key={pSocketId} className="text-[10px] font-mono text-slate-500 flex justify-between">
                <span>{pSocketId.substring(0, 10)}...</span>
                <span className="capitalize font-semibold text-slate-700">{state}</span>
              </div>
            ))}
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
        description="Share this link or room code to invite teammates into this session."
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
