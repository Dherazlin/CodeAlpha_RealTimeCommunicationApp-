import { useState, useEffect, useRef, useCallback } from 'react';
import { rtcConfig } from '../config/webrtc';

/**
 * Custom hook managing 1-to-1 WebRTC Audio & Video communication for Korus Phase 4
 *
 * @param {Object} params
 * @param {import('socket.io-client').Socket | null} params.socket - Active authenticated Socket.io client
 * @param {string} params.roomId - Active meeting room ID
 * @param {Function} params.onNotification - Callback to show subtle UI toast messages
 */
export function useWebRTC({ socket, roomId, onNotification }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteSocketId, setRemoteSocketId] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Permission & Device Status
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unavailable'
  const [permissionError, setPermissionError] = useState(null);

  // WebRTC Peer Connection State
  const [webrtcState, setWebrtcState] = useState('new'); // 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'

  // Refs for stable lifecycle management
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const candidateQueueRef = useRef([]);
  const remoteSocketIdRef = useRef(null);

  /**
   * Request local camera and microphone access
   */
  const initLocalMedia = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus('unavailable');
        setPermissionError('Media devices are not supported on this browser context.');
        if (onNotification) {
          onNotification('Camera and microphone are not supported on this browser.');
        }
        return null;
      }

      console.log('[WebRTC] Requesting local camera and microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[WebRTC] Local MediaStream acquired successfully:', stream.id);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setPermissionStatus('granted');
      setPermissionError(null);
      return stream;
    } catch (err) {
      console.warn('[WebRTC] getUserMedia failed:', err.name, err.message);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setPermissionError(
          'Camera and microphone access was denied. You can still remain in the meeting, but others will not receive your media.'
        );
        if (onNotification) {
          onNotification('Camera and microphone access was denied. You can still join the call.');
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionStatus('unavailable');
        setPermissionError('No camera or microphone found on your device.');
        if (onNotification) {
          onNotification('No camera or microphone hardware found.');
        }
      } else {
        setPermissionStatus('unavailable');
        setPermissionError(`Media device error: ${err.message}`);
        if (onNotification) {
          onNotification('Unable to access media devices.');
        }
      }
      return null;
    }
  }, [onNotification]);

  /**
   * Create and configure RTCPeerConnection for a remote peer
   */
  const createPeerConnection = useCallback(
    (targetSocketId) => {
      // Close any existing connection first
      if (pcRef.current) {
        console.log('[WebRTC] Closing previous RTCPeerConnection before creating new one.');
        pcRef.current.close();
        pcRef.current = null;
      }

      console.log(`[WebRTC] Initializing new RTCPeerConnection for target peer: ${targetSocketId}`);
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;
      remoteSocketIdRef.current = targetSocketId;
      setRemoteSocketId(targetSocketId);
      candidateQueueRef.current = [];

      // Add local media tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          console.log(`[WebRTC] Adding local ${track.kind} track to RTCPeerConnection`);
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote media track received on peerConnection:', event.track.kind);
        const [incomingStream] = event.streams;
        if (incomingStream) {
          console.log('[WebRTC] Remote MediaStream attached:', incomingStream.id);
          setRemoteStream(incomingStream);
        }
      };

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc-ice-candidate', {
            targetSocketId,
            candidate: event.candidate,
            roomId,
          });
        }
      };

      // Handle Connection State changes
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`[WebRTC] Connection state changed: ${state}`);
        setWebrtcState(state);

        if (state === 'connected') {
          if (onNotification) {
            onNotification('1-to-1 WebRTC video call connected');
          }
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          setRemoteStream(null);
        }
      };

      // Handle ICE Connection State changes
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE connection state: ${pc.iceConnectionState}`);
      };

      return pc;
    },
    [socket, roomId, onNotification]
  );

  /**
   * Process queued ICE candidates after remote description is set
   */
  const processCandidateQueue = async (pc) => {
    while (candidateQueueRef.current.length > 0) {
      const candidate = candidateQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Failed to add queued ICE candidate:', err);
      }
    }
  };

  /**
   * Initiator: Create and send WebRTC Offer to target peer
   */
  const initiateOffer = useCallback(
    async (targetSocketId) => {
      try {
        console.log(`[WebRTC] Creating offer for peer ${targetSocketId}...`);
        const pc = createPeerConnection(targetSocketId);

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);
        console.log('[WebRTC] Local description (offer) set, sending via Socket.io');

        socket.emit('webrtc-offer', {
          targetSocketId,
          offer,
          roomId,
        });
      } catch (err) {
        console.error('[WebRTC] Failed to initiate offer:', err);
      }
    },
    [createPeerConnection, socket, roomId]
  );

  /**
   * Responder: Receive Offer, set remote description, create and send Answer
   */
  const handleReceiveOffer = useCallback(
    async ({ senderSocketId, offer }) => {
      try {
        console.log(`[WebRTC] Handling received offer from peer ${senderSocketId}...`);
        const pc = createPeerConnection(senderSocketId);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('[WebRTC] Remote description (offer) set successfully');

        await processCandidateQueue(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] Local description (answer) set, sending via Socket.io');

        socket.emit('webrtc-answer', {
          targetSocketId: senderSocketId,
          answer,
          roomId,
        });
      } catch (err) {
        console.error('[WebRTC] Failed to handle received offer:', err);
      }
    },
    [createPeerConnection, socket, roomId]
  );

  /**
   * Initiator: Receive Answer and set remote description
   */
  const handleReceiveAnswer = useCallback(async ({ senderSocketId, answer }) => {
    try {
      console.log(`[WebRTC] Handling received answer from peer ${senderSocketId}...`);
      const pc = pcRef.current;
      if (!pc) {
        console.warn('[WebRTC] No active RTCPeerConnection found for answer');
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Remote description (answer) set successfully');

      await processCandidateQueue(pc);
    } catch (err) {
      console.error('[WebRTC] Failed to handle received answer:', err);
    }
  }, []);

  /**
   * Receive and add ICE Candidate
   */
  const handleReceiveIceCandidate = useCallback(async ({ candidate }) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
      // Queue candidate until remote description is set
      candidateQueueRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[WebRTC] Failed to add ICE candidate:', err);
    }
  }, []);

  /**
   * Toggle local microphone track
   */
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((track) => {
          track.enabled = nextState;
        });
        setIsMicOn(nextState);

        // Sync state to peers via Socket.io
        if (socket) {
          socket.emit('user-toggle-media', {
            roomId,
            isMicOn: nextState,
            isCameraOn,
          });
        }
        return nextState;
      }
    }
    const fallback = !isMicOn;
    setIsMicOn(fallback);
    return fallback;
  }, [isMicOn, isCameraOn, socket, roomId]);

  /**
   * Toggle local camera track
   */
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach((track) => {
          track.enabled = nextState;
        });
        setIsCameraOn(nextState);

        // Sync state to peers via Socket.io
        if (socket) {
          socket.emit('user-toggle-media', {
            roomId,
            isMicOn,
            isCameraOn: nextState,
          });
        }
        return nextState;
      }
    }
    const fallback = !isCameraOn;
    setIsCameraOn(fallback);
    return fallback;
  }, [isCameraOn, isMicOn, socket, roomId]);

  /**
   * Clean up WebRTC peer connections and local media streams
   */
  const cleanup = useCallback(() => {
    console.log('[WebRTC] Executing complete WebRTC cleanup...');

    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`[WebRTC] Stopping local ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    candidateQueueRef.current = [];
    remoteSocketIdRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteSocketId(null);
    setWebrtcState('closed');
  }, []);

  // Initialize local media on mount
  useEffect(() => {
    initLocalMedia();

    return () => {
      cleanup();
    };
  }, [initLocalMedia, cleanup]);

  // Bind Socket.io Signalling Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('webrtc-offer', handleReceiveOffer);
    socket.on('webrtc-answer', handleReceiveAnswer);
    socket.on('webrtc-ice-candidate', handleReceiveIceCandidate);

    return () => {
      socket.off('webrtc-offer', handleReceiveOffer);
      socket.off('webrtc-answer', handleReceiveAnswer);
      socket.off('webrtc-ice-candidate', handleReceiveIceCandidate);
    };
  }, [socket, handleReceiveOffer, handleReceiveAnswer, handleReceiveIceCandidate]);

  return {
    localStream,
    remoteStream,
    remoteSocketId,
    isMicOn,
    isCameraOn,
    permissionStatus,
    permissionError,
    webrtcState,
    initiateOffer,
    toggleMic,
    toggleCamera,
    cleanup,
  };
}
