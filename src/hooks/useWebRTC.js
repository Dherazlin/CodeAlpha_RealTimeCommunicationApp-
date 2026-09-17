import { useState, useEffect, useRef, useCallback } from 'react';
import { rtcConfig } from '../config/webrtc';

/**
 * Custom hook managing Full-Mesh WebRTC Audio & Video communication for Korus Phase 5
 * Supports multi-participant video meetings (3–6 participants).
 *
 * @param {Object} params
 * @param {import('socket.io-client').Socket | null} params.socket - Active authenticated Socket.io client
 * @param {string} params.roomId - Active meeting room ID
 * @param {Function} [params.onNotification] - Callback to show subtle UI toast messages
 */
export function useWebRTC({ socket, roomId, onNotification }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { [socketId]: MediaStream }
  const [peerStates, setPeerStates] = useState({}); // { [socketId]: connectionState }

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Permission & Device Status
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unavailable'
  const [permissionError, setPermissionError] = useState(null);

  // Refs for stable lifecycle & multi-peer connection management
  const peerConnectionsRef = useRef(new Map()); // Map<socketId, RTCPeerConnection>
  const candidateQueuesRef = useRef(new Map()); // Map<socketId, RTCIceCandidateInit[]>
  const localStreamRef = useRef(null);

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

      console.log('[WebRTC Mesh] Requesting local camera and microphone permissions...');
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

      console.log('[WebRTC Mesh] Local MediaStream acquired successfully:', stream.id);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setPermissionStatus('granted');
      setPermissionError(null);
      return stream;
    } catch (err) {
      console.warn('[WebRTC Mesh] getUserMedia failed:', err.name, err.message);

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
   * Process queued ICE candidates for a specific peer
   */
  const processCandidateQueue = useCallback(async (targetSocketId, pc) => {
    const queue = candidateQueuesRef.current.get(targetSocketId) || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`[WebRTC Mesh] Failed to add queued ICE candidate for ${targetSocketId}:`, err);
      }
    }
    candidateQueuesRef.current.set(targetSocketId, []);
  }, []);

  /**
   * Create and configure RTCPeerConnection for a specific remote peer in the mesh
   */
  const createPeerConnection = useCallback(
    (targetSocketId) => {
      // If a connection already exists for this peer, cleanly close it first
      if (peerConnectionsRef.current.has(targetSocketId)) {
        console.log(`[WebRTC Mesh] Closing existing RTCPeerConnection for ${targetSocketId} before recreating.`);
        const oldPc = peerConnectionsRef.current.get(targetSocketId);
        oldPc.onicecandidate = null;
        oldPc.ontrack = null;
        oldPc.onconnectionstatechange = null;
        oldPc.close();
        peerConnectionsRef.current.delete(targetSocketId);
      }

      console.log(`[WebRTC Mesh] Initializing new RTCPeerConnection for peer: ${targetSocketId}`);
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionsRef.current.set(targetSocketId, pc);

      if (!candidateQueuesRef.current.has(targetSocketId)) {
        candidateQueuesRef.current.set(targetSocketId, []);
      }

      setPeerStates((prev) => ({ ...prev, [targetSocketId]: 'connecting' }));

      // Add local media tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          console.log(`[WebRTC Mesh] Adding local ${track.kind} track to peer ${targetSocketId}`);
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        console.log(`[WebRTC Mesh] Remote track (${event.track.kind}) received from peer: ${targetSocketId}`);
        const [incomingStream] = event.streams;
        if (incomingStream) {
          console.log(`[WebRTC Mesh] Remote MediaStream attached for peer: ${targetSocketId} (stream: ${incomingStream.id})`);
          setRemoteStreams((prev) => ({
            ...prev,
            [targetSocketId]: incomingStream,
          }));
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
        console.log(`[WebRTC Mesh] Peer ${targetSocketId} connection state changed: ${state}`);
        setPeerStates((prev) => ({
          ...prev,
          [targetSocketId]: state,
        }));

        if (state === 'failed' || state === 'closed' || state === 'disconnected') {
          // Remove remote stream if disconnected
          setRemoteStreams((prev) => {
            const updated = { ...prev };
            delete updated[targetSocketId];
            return updated;
          });
        }
      };

      // Handle ICE Connection State changes
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC Mesh] Peer ${targetSocketId} ICE state: ${pc.iceConnectionState}`);
      };

      return pc;
    },
    [socket, roomId]
  );

  /**
   * Deterministic Offer: Existing participant initiates WebRTC Offer to a newly joined peer
   */
  const initiateOffer = useCallback(
    async (targetSocketId) => {
      if (!targetSocketId) return;

      try {
        console.log(`[WebRTC Mesh] Initiating WebRTC offer to peer: ${targetSocketId}`);
        const pc = createPeerConnection(targetSocketId);

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);
        console.log(`[WebRTC Mesh] Local offer description set for peer ${targetSocketId}, relaying via Socket.io`);

        socket.emit('webrtc-offer', {
          targetSocketId,
          offer,
          roomId,
        });
      } catch (err) {
        console.error(`[WebRTC Mesh] Failed to initiate offer to peer ${targetSocketId}:`, err);
      }
    },
    [createPeerConnection, socket, roomId]
  );

  /**
   * Responder: Receive Offer from an existing participant, create and send Answer
   */
  const handleReceiveOffer = useCallback(
    async ({ senderSocketId, offer }) => {
      if (!senderSocketId || !offer) return;

      try {
        console.log(`[WebRTC Mesh] Handling received offer from peer: ${senderSocketId}`);
        const pc = createPeerConnection(senderSocketId);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`[WebRTC Mesh] Remote description (offer) set for peer ${senderSocketId}`);

        await processCandidateQueue(senderSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`[WebRTC Mesh] Local answer description set for peer ${senderSocketId}, relaying via Socket.io`);

        socket.emit('webrtc-answer', {
          targetSocketId: senderSocketId,
          answer,
          roomId,
        });
      } catch (err) {
        console.error(`[WebRTC Mesh] Failed to handle received offer from peer ${senderSocketId}:`, err);
      }
    },
    [createPeerConnection, processCandidateQueue, socket, roomId]
  );

  /**
   * Initiator: Receive Answer from responder and set remote description
   */
  const handleReceiveAnswer = useCallback(
    async ({ senderSocketId, answer }) => {
      if (!senderSocketId || !answer) return;

      try {
        console.log(`[WebRTC Mesh] Handling received answer from peer: ${senderSocketId}`);
        const pc = peerConnectionsRef.current.get(senderSocketId);
        if (!pc) {
          console.warn(`[WebRTC Mesh] No active RTCPeerConnection found for answer from ${senderSocketId}`);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`[WebRTC Mesh] Remote description (answer) set for peer ${senderSocketId}`);

        await processCandidateQueue(senderSocketId, pc);
      } catch (err) {
        console.error(`[WebRTC Mesh] Failed to handle received answer from peer ${senderSocketId}:`, err);
      }
    },
    [processCandidateQueue]
  );

  /**
   * Receive and route ICE Candidate to the appropriate peer connection
   */
  const handleReceiveIceCandidate = useCallback(async ({ senderSocketId, candidate }) => {
    if (!senderSocketId || !candidate) return;

    const pc = peerConnectionsRef.current.get(senderSocketId);
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
      // Queue candidate until remote description is set
      const queue = candidateQueuesRef.current.get(senderSocketId) || [];
      queue.push(candidate);
      candidateQueuesRef.current.set(senderSocketId, queue);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn(`[WebRTC Mesh] Failed to add ICE candidate for peer ${senderSocketId}:`, err);
    }
  }, []);

  /**
   * Cleanly close and remove a single peer connection (e.g. when participant leaves)
   */
  const closePeerConnection = useCallback((targetSocketId) => {
    if (!targetSocketId) return;
    console.log(`[WebRTC Mesh] Cleaning up peer connection for left peer: ${targetSocketId}`);

    const pc = peerConnectionsRef.current.get(targetSocketId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(targetSocketId);
    }

    candidateQueuesRef.current.delete(targetSocketId);

    setRemoteStreams((prev) => {
      const updated = { ...prev };
      delete updated[targetSocketId];
      return updated;
    });

    setPeerStates((prev) => {
      const updated = { ...prev };
      delete updated[targetSocketId];
      return updated;
    });
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
   * Clean up all WebRTC peer connections and local media tracks
   */
  const cleanup = useCallback(() => {
    console.log('[WebRTC Mesh] Executing complete WebRTC cleanup for all mesh peers...');

    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`[WebRTC Mesh] Stopping local ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, socketId) => {
      console.log(`[WebRTC Mesh] Closing peer connection for: ${socketId}`);
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    });

    peerConnectionsRef.current.clear();
    candidateQueuesRef.current.clear();

    setLocalStream(null);
    setRemoteStreams({});
    setPeerStates({});
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
    remoteStreams,
    peerStates,
    isMicOn,
    isCameraOn,
    permissionStatus,
    permissionError,
    initiateOffer,
    closePeerConnection,
    toggleMic,
    toggleCamera,
    cleanup,
  };
}
