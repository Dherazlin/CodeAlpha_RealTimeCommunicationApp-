import { useState, useEffect, useRef, useCallback } from 'react';
import { rtcConfig } from '../config/webrtc';

/**
 * Custom hook managing Full-Mesh WebRTC Audio & Video communication for Korus.
 * Supports multi-participant video meetings (2, 3, 4+ participants).
 * Phase 1 Architecture Fix:
 * - Deterministic single shared localMediaPromiseRef
 * - Idempotent createPeerConnection
 * - Pre-registered signaling listeners
 * - Safe late-track attachment & renegotiation loop prevention
 * - Full preservation of RTCRtpSender screen-sharing track replacement
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
  const [isMediaReady, setIsMediaReady] = useState(false);

  // Screen sharing state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);
  const cameraWasOnBeforeShareRef = useRef(false);

  // Permission & Device Status
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unavailable'
  const [permissionError, setPermissionError] = useState(null);

  // Refs for stable lifecycle & multi-peer connection management
  const peerConnectionsRef = useRef(new Map()); // Map<socketId, RTCPeerConnection>
  const candidateQueuesRef = useRef(new Map()); // Map<socketId, RTCIceCandidateInit[]>
  const localStreamRef = useRef(null);
  const localMediaPromiseRef = useRef(null); // Single shared initialization promise for the lifetime of the meeting

  // Keep stable refs for access inside callbacks without triggering recreation
  const socketRef = useRef(socket);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const isCameraOnRef = useRef(isCameraOn);
  useEffect(() => {
    isCameraOnRef.current = isCameraOn;
  }, [isCameraOn]);

  const isScreenSharingRef = useRef(isScreenSharing);
  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  const onNotificationRef = useRef(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  /**
   * Attach or replace local tracks on a specific peer connection.
   * Handles audio and video, preventing duplicate senders.
   * Crucial: Respects active screen sharing so camera initialization never clobbers screen tracks.
   */
  const attachLocalTracksToPeer = useCallback((pc, targetSocketId) => {
    if (!pc || pc.connectionState === 'closed') return;
    const stream = localStreamRef.current;
    if (!stream) return;

    const senders = pc.getSenders();
    const audioTrack = stream.getAudioTracks()[0];
    const cameraTrack = stream.getVideoTracks()[0];

    // 1. Audio track
    if (audioTrack) {
      const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');
      if (audioSender) {
        if (audioSender.track !== audioTrack) {
          audioSender.replaceTrack(audioTrack).catch((err) => {
            console.warn(`[WebRTC Mesh] replaceTrack audio error for ${targetSocketId}:`, err);
          });
        }
      } else {
        try {
          console.log(`[WebRTC Mesh] Adding audio track to peer ${targetSocketId}`);
          pc.addTrack(audioTrack, stream);
        } catch (err) {
          console.warn(`[WebRTC Mesh] addTrack audio error for ${targetSocketId}:`, err);
        }
      }
    }

    // 2. Video track: inspect active screen sharing first!
    const activeVideoTrack =
      isScreenSharingRef.current && screenStreamRef.current
        ? screenStreamRef.current.getVideoTracks()[0]
        : cameraTrack;

    if (activeVideoTrack) {
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        if (videoSender.track !== activeVideoTrack) {
          videoSender.replaceTrack(activeVideoTrack).catch((err) => {
            console.warn(`[WebRTC Mesh] replaceTrack video error for ${targetSocketId}:`, err);
          });
        }
      } else {
        try {
          console.log(
            `[WebRTC Mesh] Adding video track (${activeVideoTrack.label}) to peer ${targetSocketId}`
          );
          pc.addTrack(activeVideoTrack, stream);
        } catch (err) {
          console.warn(`[WebRTC Mesh] addTrack video error for ${targetSocketId}:`, err);
        }
      }
    }
  }, []);

  /**
   * Retroactively attach local tracks to all existing peer connections.
   * Invoked when getUserMedia resolves after peers have already been registered.
   */
  const attachLocalTracksToExistingPeers = useCallback(
    (stream) => {
      if (!stream) return;
      console.log(
        `[WebRTC Mesh] Retroactively attaching local tracks to ${peerConnectionsRef.current.size} active peers`
      );
      peerConnectionsRef.current.forEach((pc, targetSocketId) => {
        attachLocalTracksToPeer(pc, targetSocketId);
      });
    },
    [attachLocalTracksToPeer]
  );

  /**
   * Single shared local media initialization promise.
   * Ensures getUserMedia() runs only once per meeting lifecycle without races.
   */
  const initLocalMedia = useCallback(async () => {
    if (localMediaPromiseRef.current) {
      return localMediaPromiseRef.current;
    }

    localMediaPromiseRef.current = (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionStatus('unavailable');
          setPermissionError('Media devices are not supported on this browser context.');
          if (onNotificationRef.current) {
            onNotificationRef.current('Camera and microphone are not supported on this browser.');
          }
          setIsMediaReady(true);
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
        setIsMediaReady(true);

        // Retroactively attach tracks to any peers created before getUserMedia resolved
        attachLocalTracksToExistingPeers(stream);

        return stream;
      } catch (err) {
        console.warn('[WebRTC Mesh] getUserMedia failed:', err.name, err.message);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionStatus('denied');
          setPermissionError(
            'Camera and microphone access was denied. You can still remain in the meeting, but others will not receive your media.'
          );
          if (onNotificationRef.current) {
            onNotificationRef.current('Camera and microphone access was denied. You can still join the call.');
          }
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setPermissionStatus('unavailable');
          setPermissionError('No camera or microphone found on your device.');
          if (onNotificationRef.current) {
            onNotificationRef.current('No camera or microphone hardware found.');
          }
        } else {
          setPermissionStatus('unavailable');
          setPermissionError(`Media device error: ${err.message}`);
          if (onNotificationRef.current) {
            onNotificationRef.current('Unable to access media devices.');
          }
        }
        setIsMediaReady(true);
        return null;
      }
    })();

    return localMediaPromiseRef.current;
  }, [attachLocalTracksToExistingPeers]);

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
   * Create and configure RTCPeerConnection for a remote peer in the mesh.
   * IDEMPOTENT: If an active peer already exists, reuse it instead of destroying it.
   */
  const createPeerConnection = useCallback(
    (targetSocketId) => {
      if (!targetSocketId) return null;

      // 1. If connection already exists and is active, reuse it
      if (peerConnectionsRef.current.has(targetSocketId)) {
        const existingPc = peerConnectionsRef.current.get(targetSocketId);
        if (existingPc && existingPc.connectionState !== 'closed') {
          console.log(`[WebRTC Mesh] Reusing existing RTCPeerConnection for ${targetSocketId}`);
          attachLocalTracksToPeer(existingPc, targetSocketId);
          return existingPc;
        }
      }

      console.log(`[WebRTC Mesh] Initializing new RTCPeerConnection for peer: ${targetSocketId}`);
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionsRef.current.set(targetSocketId, pc);

      if (!candidateQueuesRef.current.has(targetSocketId)) {
        candidateQueuesRef.current.set(targetSocketId, []);
      }

      setPeerStates((prev) => ({ ...prev, [targetSocketId]: 'connecting' }));

      // Attach local media tracks if available
      attachLocalTracksToPeer(pc, targetSocketId);

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        console.log(
          `[WebRTC Mesh] Remote track (${event.track.kind}) received from peer: ${targetSocketId}`
        );
        const [incomingStream] = event.streams;
        if (incomingStream) {
          console.log(
            `[WebRTC Mesh] Remote MediaStream attached for peer: ${targetSocketId} (stream: ${incomingStream.id})`
          );
          setRemoteStreams((prev) => ({
            ...prev,
            [targetSocketId]: incomingStream,
          }));
        }
      };

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc-ice-candidate', {
            targetSocketId,
            candidate: event.candidate,
            roomId: roomIdRef.current,
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

      // Safe renegotiation handling to avoid recursive offer loops
      let isNegotiating = false;
      pc.onnegotiationneeded = async () => {
        if (isNegotiating || pc.signalingState !== 'stable') {
          return;
        }
        try {
          isNegotiating = true;
          console.log(`[WebRTC Mesh] onnegotiationneeded for peer: ${targetSocketId}`);
          const offer = await pc.createOffer();
          if (pc.signalingState !== 'stable') return;
          await pc.setLocalDescription(offer);
          if (socketRef.current) {
            socketRef.current.emit('webrtc-offer', {
              targetSocketId,
              offer,
              roomId: roomIdRef.current,
            });
          }
        } catch (err) {
          console.warn(`[WebRTC Mesh] Renegotiation error for ${targetSocketId}:`, err);
        } finally {
          isNegotiating = false;
        }
      };

      return pc;
    },
    [attachLocalTracksToPeer]
  );

  /**
   * Deterministic Offer: Existing participant initiates WebRTC Offer to newly joined peer
   */
  const initiateOffer = useCallback(
    async (targetSocketId) => {
      if (!targetSocketId) return;

      try {
        console.log(`[WebRTC Mesh] Initiating WebRTC offer to peer: ${targetSocketId}`);
        const pc = createPeerConnection(targetSocketId);
        if (!pc) return;

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);
        console.log(`[WebRTC Mesh] Local offer description set for peer ${targetSocketId}, relaying via Socket.io`);

        if (socketRef.current) {
          socketRef.current.emit('webrtc-offer', {
            targetSocketId,
            offer,
            roomId: roomIdRef.current,
          });
        }
      } catch (err) {
        console.error(`[WebRTC Mesh] Failed to initiate offer to peer ${targetSocketId}:`, err);
      }
    },
    [createPeerConnection]
  );

  /**
   * Responder: Receive Offer from existing participant, create and send Answer
   */
  const handleReceiveOffer = useCallback(
    async ({ senderSocketId, offer }) => {
      if (!senderSocketId || !offer) return;

      try {
        console.log(`[WebRTC Mesh] Handling received offer from peer: ${senderSocketId}`);
        const pc = createPeerConnection(senderSocketId);
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`[WebRTC Mesh] Remote description (offer) set for peer ${senderSocketId}`);

        await processCandidateQueue(senderSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`[WebRTC Mesh] Local answer description set for peer ${senderSocketId}, relaying via Socket.io`);

        if (socketRef.current) {
          socketRef.current.emit('webrtc-answer', {
            targetSocketId: senderSocketId,
            answer,
            roomId: roomIdRef.current,
          });
        }
      } catch (err) {
        console.error(`[WebRTC Mesh] Failed to handle received offer from peer ${senderSocketId}:`, err);
      }
    },
    [createPeerConnection, processCandidateQueue]
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
   * Explicit synchronous binding of WebRTC signaling listeners to a socket instance.
   * Enables pre-registering listeners before socket.connect() / join-room.
   */
  const attachSignalingListeners = useCallback(
    (socketInstance) => {
      if (!socketInstance) return;
      console.log(`[WebRTC Mesh] Attaching signaling listeners to socket instance: ${socketInstance.id || 'unconnected'}`);
      socketInstance.off('webrtc-offer', handleReceiveOffer);
      socketInstance.off('webrtc-answer', handleReceiveAnswer);
      socketInstance.off('webrtc-ice-candidate', handleReceiveIceCandidate);

      socketInstance.on('webrtc-offer', handleReceiveOffer);
      socketInstance.on('webrtc-answer', handleReceiveAnswer);
      socketInstance.on('webrtc-ice-candidate', handleReceiveIceCandidate);
    },
    [handleReceiveOffer, handleReceiveAnswer, handleReceiveIceCandidate]
  );

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
      pc.onnegotiationneeded = null;
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

        if (socketRef.current) {
          socketRef.current.emit('user-toggle-media', {
            roomId: roomIdRef.current,
            isMicOn: nextState,
            isCameraOn: isCameraOnRef.current,
          });
        }
        return nextState;
      }
    }
    const fallback = !isMicOn;
    setIsMicOn(fallback);
    return fallback;
  }, [isMicOn]);

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

        if (socketRef.current) {
          socketRef.current.emit('user-toggle-media', {
            roomId: roomIdRef.current,
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
  }, [isCameraOn, isMicOn]);

  /**
   * Internal: replace the video sender track across all active peer connections.
   * @param {MediaStreamTrack|null} track - The track to send, or null to send silence/black
   */
  const replaceVideoTrackOnAllPeers = useCallback((track) => {
    peerConnectionsRef.current.forEach((pc, socketId) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender
          .replaceTrack(track)
          .then(() => {
            console.log(
              `[WebRTC Screen Share] Replaced video track on peer ${socketId} with: ${
                track ? track.label : 'null'
              }`
            );
          })
          .catch((err) => {
            console.warn(`[WebRTC Screen Share] replaceTrack failed for peer ${socketId}:`, err);
          });
      }
    });
  }, []);

  /**
   * Stop screen sharing and restore the camera track.
   * Safe to call from track.onended (browser stop button) or from user click.
   */
  const stopScreenShare = useCallback(
    (restoreCamera) => {
      console.log('[WebRTC Screen Share] Stopping screen share...');

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.onended = null;
          track.stop();
        });
        screenStreamRef.current = null;
      }

      const shouldRestoreCamera =
        restoreCamera !== undefined ? restoreCamera : cameraWasOnBeforeShareRef.current;

      if (shouldRestoreCamera && localStreamRef.current) {
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        if (cameraTrack) {
          cameraTrack.enabled = true;
          replaceVideoTrackOnAllPeers(cameraTrack);
          setIsCameraOn(true);
          console.log('[WebRTC Screen Share] Camera track restored after screen share stop.');
        }
      } else {
        if (localStreamRef.current) {
          const cameraTrack = localStreamRef.current.getVideoTracks()[0];
          if (cameraTrack) {
            cameraTrack.enabled = false;
            replaceVideoTrackOnAllPeers(cameraTrack);
          }
        }
        setIsCameraOn(false);
      }

      if (socketRef.current) {
        socketRef.current.emit('screen-share-stop', { roomId: roomIdRef.current });
      }

      setIsScreenSharing(false);
      cameraWasOnBeforeShareRef.current = false;
    },
    [replaceVideoTrackOnAllPeers]
  );

  /**
   * Start screen sharing.
   * Requests server approval first (one-sharer-per-room), then calls getDisplayMedia().
   * Uses RTCRtpSender.replaceTrack() — no new peer connections created.
   */
  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      const msg = 'Screen sharing is not supported by this browser.';
      if (onNotificationRef.current) onNotificationRef.current(msg);
      return { success: false, error: msg };
    }

    const currentSocket = socketRef.current;
    if (!currentSocket) {
      return { success: false, error: 'Not connected to meeting.' };
    }

    if (isScreenSharing) {
      stopScreenShare();
      return { success: true };
    }

    return new Promise((resolve) => {
      const onStarted = async (data) => {
        currentSocket.off('screen-share-denied', onDenied);

        try {
          console.log('[WebRTC Screen Share] Server approved screen share. Calling getDisplayMedia...');
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              displaySurface: 'monitor',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          });

          screenStreamRef.current = screenStream;
          const screenTrack = screenStream.getVideoTracks()[0];

          cameraWasOnBeforeShareRef.current = isCameraOnRef.current;
          replaceVideoTrackOnAllPeers(screenTrack);

          screenTrack.onended = () => {
            console.log('[WebRTC Screen Share] Browser native stop triggered (track.onended).');
            stopScreenShare(cameraWasOnBeforeShareRef.current);
          };

          setIsScreenSharing(true);
          console.log('[WebRTC Screen Share] Screen sharing started successfully.');
          resolve({ success: true, stream: screenStream });
        } catch (err) {
          console.warn('[WebRTC Screen Share] getDisplayMedia failed:', err.name, err.message);
          currentSocket.emit('screen-share-stop', { roomId: roomIdRef.current });

          let userMessage = 'Screen sharing failed.';
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            userMessage = 'Screen sharing permission was denied.';
          } else if (err.name === 'NotSupportedError') {
            userMessage = 'Screen sharing is not supported by this browser.';
          } else if (err.name === 'AbortError') {
            userMessage = null;
            currentSocket.emit('screen-share-stop', { roomId: roomIdRef.current });
          }

          if (userMessage && onNotificationRef.current) onNotificationRef.current(userMessage);
          resolve({ success: false, error: userMessage });
        }
      };

      const onDenied = ({ reason, sharerName }) => {
        currentSocket.off('screen-share-started', onStarted);
        console.log('[WebRTC Screen Share] Screen share denied by server:', reason);
        resolve({ success: false, error: reason, denied: true, sharerName });
      };

      currentSocket.once('screen-share-started', onStarted);
      currentSocket.once('screen-share-denied', onDenied);

      currentSocket.emit('screen-share-request', { roomId: roomIdRef.current });

      setTimeout(() => {
        currentSocket.off('screen-share-started', onStarted);
        currentSocket.off('screen-share-denied', onDenied);
        resolve({ success: false, error: 'Screen share request timed out.' });
      }, 8000);
    });
  }, [isScreenSharing, stopScreenShare, replaceVideoTrackOnAllPeers]);

  /**
   * Complete WebRTC cleanup on component unmount
   */
  const cleanup = useCallback(() => {
    console.log('[WebRTC Mesh] Executing complete WebRTC cleanup for all mesh peers...');

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`[WebRTC Mesh] Stopping local ${track.kind} track`);
        track.stop();
      });
      localStreamRef.current = null;
    }
    localMediaPromiseRef.current = null;

    peerConnectionsRef.current.forEach((pc, socketId) => {
      console.log(`[WebRTC Mesh] Closing peer connection for: ${socketId}`);
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      pc.close();
    });

    peerConnectionsRef.current.clear();
    candidateQueuesRef.current.clear();

    setLocalStream(null);
    setRemoteStreams({});
    setPeerStates({});
    setIsScreenSharing(false);
    setIsMediaReady(false);
  }, []);

  // Initialize local media on initial hook mount
  useEffect(() => {
    initLocalMedia();

    return () => {
      cleanup();
    };
  }, [initLocalMedia, cleanup]);

  // Bind Socket.io Signalling Listeners if socket prop changes
  useEffect(() => {
    if (!socket) return;
    attachSignalingListeners(socket);

    return () => {
      socket.off('webrtc-offer', handleReceiveOffer);
      socket.off('webrtc-answer', handleReceiveAnswer);
      socket.off('webrtc-ice-candidate', handleReceiveIceCandidate);
    };
  }, [socket, attachSignalingListeners, handleReceiveOffer, handleReceiveAnswer, handleReceiveIceCandidate]);

  return {
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
    handleReceiveOffer,
    handleReceiveAnswer,
    handleReceiveIceCandidate,
    attachSignalingListeners,
    closePeerConnection,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
}
