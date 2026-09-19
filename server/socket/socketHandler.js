import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';

/**
 * In-memory room store for real-time presence & WebRTC signaling
 * Map<roomId, Map<socketId, participant>>
 */
const rooms = new Map();
const MAX_PARTICIPANTS = 6;

/**
 * In-memory screen sharing state per room
 * Map<roomId, { socketId, userId, userName }>
 */
const screenSharers = new Map();

/**
 * In-memory whiteboard state per room
 * Map<roomId, Array<Stroke>>
 */
const whiteboardStrokes = new Map();
const whiteboardSaveTimeouts = new Map();

/**
 * Helper to save whiteboard state to MongoDB
 */
const saveWhiteboardToDB = async (roomId, isFinal = false) => {
  if (!whiteboardStrokes.has(roomId)) return;
  const strokes = whiteboardStrokes.get(roomId);
  
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (meeting) {
      meeting.whiteboardData = JSON.stringify(strokes);
      await meeting.save();
      console.log(`[Socket.io] Saved whiteboard for room ${roomId} to DB (${strokes.length} strokes). isFinal: ${isFinal}`);
    }
  } catch (err) {
    console.error(`[Socket.io] Error saving whiteboard for room ${roomId}:`, err.message);
  }
};

/**
 * Configure and initialize Socket.io handlers
 * @param {import('socket.io').Server} io
 */
export function setupSocketHandlers(io) {
  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      // Extract JWT from handshake auth or headers
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        console.warn(`[Socket.io] Connection rejected: No authentication token provided for socket ${socket.id}`);
        return next(new Error('Authentication token required'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'korus_fallback_secret');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.warn(`[Socket.io] Connection rejected: User not found for token ID ${decoded.id}`);
        return next(new Error('User not found'));
      }

      // Attach authenticated user information to socket
      socket.user = {
        id: user._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        role: user.role || 'Member',
      };

      console.log(`[Socket.io] Authenticated socket ${socket.id} for user ${socket.user.name} (${socket.user.id})`);
      next();
    } catch (err) {
      console.warn(`[Socket.io] Authentication failed for socket ${socket.id}:`, err.message);
      return next(new Error('Invalid or expired authentication token'));
    }
  });

  // Socket Connection Event
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id} (User: ${socket.user?.name})`);

    // Track rooms this socket is currently in
    let currentRoomId = null;

    /**
     * Handle joining a meeting room
     */
    socket.on('join-room', async ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('error-message', { message: 'Invalid or missing Room ID' });
        return;
      }

      const cleanRoomId = roomId.trim().toUpperCase();

      // If already in a different room, leave it first
      if (currentRoomId && currentRoomId !== cleanRoomId) {
        leaveRoomHandler(currentRoomId);
      }

      try {
        // Query MongoDB as the single source of truth for meeting existence and host ownership
        const meeting = await Meeting.findOne({ roomId: cleanRoomId });

        if (!meeting) {
          console.warn(`[Socket.io] User ${socket.user.name} attempted to join non-existent meeting: ${cleanRoomId}`);
          socket.emit('error-message', { message: `Meeting with Room ID "${cleanRoomId}" not found.` });
          return;
        }

        if (meeting.status === 'ended') {
          console.warn(`[Socket.io] User ${socket.user.name} attempted to join ended meeting: ${cleanRoomId}`);
          socket.emit('error-message', { message: 'This meeting has ended and cannot be joined.' });
          return;
        }

        if (!rooms.has(cleanRoomId)) {
          rooms.set(cleanRoomId, new Map());
          
          // Load whiteboard from DB if available and memory is empty
          if (!whiteboardStrokes.has(cleanRoomId)) {
            if (meeting.whiteboardData) {
              try {
                whiteboardStrokes.set(cleanRoomId, JSON.parse(meeting.whiteboardData));
              } catch (e) {
                console.error('Error parsing whiteboard data from DB:', e);
                whiteboardStrokes.set(cleanRoomId, []);
              }
            } else {
              whiteboardStrokes.set(cleanRoomId, []);
            }
          }
        }

        const roomParticipants = rooms.get(cleanRoomId);

        // Check participant limit (3-6 supported mesh participants)
        if (roomParticipants.size >= MAX_PARTICIPANTS && !roomParticipants.has(socket.id)) {
          console.warn(
            `[Socket.io] Room ${cleanRoomId} is full (${roomParticipants.size}/${MAX_PARTICIPANTS}). Rejecting user ${socket.user.name}.`
          );
          socket.emit('error-message', {
            message: `This meeting has reached its participant limit (maximum ${MAX_PARTICIPANTS} participants).`,
          });
          return;
        }

        currentRoomId = cleanRoomId;
        socket.join(cleanRoomId);

        // Permanent Host Ownership determined strictly by MongoDB Meeting.host
        const isHost = meeting.host.toString() === socket.user.id;
        const participantRole = isHost ? 'Host' : 'Member';

        // Participant representation for real-time mesh
        const participant = {
          socketId: socket.id,
          userId: socket.user.id,
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
          avatar: socket.user.avatar,
          role: participantRole,
          isHost,
          isMicOn: true,
          isCameraOn: true,
          joinedAt: new Date().toISOString(),
        };

        roomParticipants.set(socket.id, participant);

        // Persist participant join in MongoDB
        try {
          const userIdStr = socket.user.id;
          const existingIndex = meeting.participants.findIndex(
            (p) => p.user && p.user.toString() === userIdStr
          );

          if (existingIndex !== -1) {
            meeting.participants[existingIndex].leftAt = null;
          } else {
            meeting.participants.push({
              user: socket.user.id,
              joinedAt: new Date(),
            });
          }
          await meeting.save();
        } catch (dbErr) {
          console.error('[Socket.io] Error persisting participant join in MongoDB:', dbErr.message);
        }

        console.log(
          `[Socket.io] User "${socket.user.name}" joined room "${cleanRoomId}" as ${participant.role} (isHost=${isHost}). Total in room: ${roomParticipants.size}`
        );

        // Send the current list of participants to the joining user
        const allParticipants = Array.from(roomParticipants.values());
        socket.emit('room-users', {
          roomId: cleanRoomId,
          participants: allParticipants,
          screenSharer: screenSharers.get(cleanRoomId) || null,
        });

        // Send current whiteboard state to joining user
        if (whiteboardStrokes.has(cleanRoomId)) {
          socket.emit('whiteboard-sync', { strokes: whiteboardStrokes.get(cleanRoomId) });
        }

        // Broadcast to all other participants in the room that a new participant has joined
        socket.to(cleanRoomId).emit('participant-joined', {
          roomId: cleanRoomId,
          participant,
        });
      } catch (err) {
        console.error(`[Socket.io] Error in join-room for room ${cleanRoomId}:`, err);
        socket.emit('error-message', { message: 'Internal server error while joining meeting' });
      }
    });

    /**
     * WebRTC Signalling: Offer
     * User A (initiator) sends offer to User B
     */
    socket.on('webrtc-offer', ({ targetSocketId, offer, roomId }) => {
      if (!targetSocketId || !offer) {
        return;
      }
      console.log(`[WebRTC Signalling] Relaying offer from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('webrtc-offer', {
        senderSocketId: socket.id,
        senderUser: socket.user,
        offer,
        roomId,
      });
    });

    /**
     * File Sharing Signalling
     * Broadcasts to all users in the room when a new file is uploaded
     */
    socket.on('meeting-file-shared', ({ roomId, file }) => {
      if (!roomId || !file) return;
      console.log(`[Socket.io] File shared in room ${roomId} by ${socket.user.name}`);
      socket.to(roomId).emit('meeting-file-shared', { file });
    });

    /**
     * Whiteboard Signalling
     */
    socket.on('whiteboard-draw', ({ roomId, strokeId, color, size, points }) => {
      const cleanRoomId = (roomId || currentRoomId || '').trim().toUpperCase();
      if (!cleanRoomId || !rooms.has(cleanRoomId) || !strokeId || !points) return;
      
      // Basic payload validation
      if (points.length > 500) {
         console.warn(`[Socket.io] Whiteboard payload too large from ${socket.user.name}`);
         return;
      }

      if (!whiteboardStrokes.has(cleanRoomId)) {
        whiteboardStrokes.set(cleanRoomId, []);
      }
      
      const strokes = whiteboardStrokes.get(cleanRoomId);
      
      // Protect against memory overflow (max 2000 strokes)
      if (strokes.length > 2000) return;

      const strokeData = { strokeId, color, size, points, userId: socket.user.id };
      
      // Append stroke
      strokes.push(strokeData);
      
      // Broadcast to others
      socket.to(cleanRoomId).emit('whiteboard-draw', strokeData);
      
      // Debounce DB save
      if (whiteboardSaveTimeouts.has(cleanRoomId)) {
        clearTimeout(whiteboardSaveTimeouts.get(cleanRoomId));
      }
      whiteboardSaveTimeouts.set(cleanRoomId, setTimeout(() => {
        saveWhiteboardToDB(cleanRoomId);
      }, 5000));
    });

    socket.on('whiteboard-undo', ({ roomId }) => {
      const cleanRoomId = (roomId || currentRoomId || '').trim().toUpperCase();
      if (!cleanRoomId || !whiteboardStrokes.has(cleanRoomId)) return;
      
      const strokes = whiteboardStrokes.get(cleanRoomId);
      if (strokes.length === 0) return;
      
      // Server-authoritative undo: remove the last stroke
      const removedStroke = strokes.pop();
      
      // Broadcast undo
      io.to(cleanRoomId).emit('whiteboard-undo', { strokeId: removedStroke.strokeId });
      
      saveWhiteboardToDB(cleanRoomId);
    });

    socket.on('whiteboard-clear', ({ roomId }) => {
      const cleanRoomId = (roomId || currentRoomId || '').trim().toUpperCase();
      if (!cleanRoomId) return;
      
      // Server-authoritative clear
      whiteboardStrokes.set(cleanRoomId, []);
      io.to(cleanRoomId).emit('whiteboard-clear');
      
      saveWhiteboardToDB(cleanRoomId);
    });

    /**
     * WebRTC Signalling: Answer
     * User B sends answer back to User A
     */
    socket.on('webrtc-answer', ({ targetSocketId, answer, roomId }) => {
      if (!targetSocketId || !answer) {
        return;
      }
      console.log(`[WebRTC Signalling] Relaying answer from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('webrtc-answer', {
        senderSocketId: socket.id,
        answer,
        roomId,
      });
    });

    /**
     * WebRTC Signalling: ICE Candidate Exchange
     */
    socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate, roomId }) => {
      if (!targetSocketId || !candidate) {
        return;
      }
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        senderSocketId: socket.id,
        candidate,
        roomId,
      });
    });

    /**
     * Media state synchronization (Mic / Camera on/off)
     */
    socket.on('user-toggle-media', ({ roomId, isMicOn, isCameraOn }) => {
      const cleanRoomId = (roomId || currentRoomId || '').trim().toUpperCase();
      if (!cleanRoomId || !rooms.has(cleanRoomId)) return;

      const roomParticipants = rooms.get(cleanRoomId);
      if (roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        if (typeof isMicOn === 'boolean') participant.isMicOn = isMicOn;
        if (typeof isCameraOn === 'boolean') participant.isCameraOn = isCameraOn;
      }

      socket.to(cleanRoomId).emit('user-toggle-media', {
        socketId: socket.id,
        userId: socket.user.id,
        isMicOn,
        isCameraOn,
      });
    });

    /**
     * Handle real-time chat messages
     */
    socket.on('send-message', ({ roomId, message, text }) => {
      const messageText = (message || text || '').trim();

      if (!roomId) {
        socket.emit('error-message', { message: 'Room ID is required to send messages' });
        return;
      }

      const cleanRoomId = roomId.trim().toUpperCase();
      const roomParticipants = rooms.get(cleanRoomId);

      // Validate that user is authenticated and part of this room
      if (!roomParticipants || !roomParticipants.has(socket.id)) {
        socket.emit('error-message', { message: 'You must be inside the meeting room to send messages' });
        return;
      }

      // Validate message length and content
      if (!messageText) {
        socket.emit('error-message', { message: 'Message cannot be empty' });
        return;
      }

      if (messageText.length > 1000) {
        socket.emit('error-message', { message: 'Message exceeds maximum limit of 1000 characters' });
        return;
      }

      const senderParticipant = roomParticipants.get(socket.id);

      // Generate message payload
      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        roomId: cleanRoomId,
        userId: socket.user.id,
        userName: socket.user.name,
        avatar: socket.user.avatar,
        role: senderParticipant?.role || socket.user.role,
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
      };

      console.log(`[Socket.io] Chat message in "${cleanRoomId}" from "${socket.user.name}": ${messageText.substring(0, 30)}...`);

      // Broadcast message to everyone in the room (including sender)
      io.to(cleanRoomId).emit('receive-message', chatMessage);
    });

    /**
     * Helper to handle leaving a room
     * Host ownership is NEVER transferred.
     */
    const leaveRoomHandler = async (roomIdToLeave) => {
      if (!roomIdToLeave) return;
      const cleanRoomId = roomIdToLeave.trim().toUpperCase();

      if (rooms.has(cleanRoomId)) {
        const roomParticipants = rooms.get(cleanRoomId);
        if (roomParticipants.has(socket.id)) {
          roomParticipants.delete(socket.id);

          console.log(
            `[Socket.io] User "${socket.user?.name}" left room "${cleanRoomId}". Remaining in room: ${roomParticipants.size}`
          );

          // If the leaving participant was the active screen sharer, clear and notify room
          if (screenSharers.has(cleanRoomId) && screenSharers.get(cleanRoomId).socketId === socket.id) {
            screenSharers.delete(cleanRoomId);
            console.log(`[Socket.io] Active screen sharer "${socket.user?.name}" left room "${cleanRoomId}". Clearing screen share.`);
            socket.to(cleanRoomId).emit('screen-share-stopped', {
              roomId: cleanRoomId,
              socketId: socket.id,
              userId: socket.user?.id,
              userName: socket.user?.name,
            });
          }

          // Update leftAt in MongoDB for this participant
          try {
            const meeting = await Meeting.findOne({ roomId: cleanRoomId });
            if (meeting) {
              const userIdStr = socket.user?.id;
              const participant = meeting.participants.find(
                (p) => p.user && p.user.toString() === userIdStr && !p.leftAt
              );
              if (participant) {
                participant.leftAt = new Date();
                await meeting.save();
              }
            }
          } catch (dbErr) {
            console.error('[Socket.io] Error recording participant leftAt in MongoDB:', dbErr.message);
          }

          // Broadcast to remaining users
          socket.to(cleanRoomId).emit('participant-left', {
            roomId: cleanRoomId,
            socketId: socket.id,
            userId: socket.user?.id,
            userName: socket.user?.name,
            remainingCount: roomParticipants.size,
          });

          // If room is now empty in memory, clean up maps
          if (roomParticipants.size === 0) {
            saveWhiteboardToDB(cleanRoomId, true).then(() => {
              rooms.delete(cleanRoomId);
              screenSharers.delete(cleanRoomId);
              whiteboardStrokes.delete(cleanRoomId);
              if (whiteboardSaveTimeouts.has(cleanRoomId)) {
                 clearTimeout(whiteboardSaveTimeouts.get(cleanRoomId));
                 whiteboardSaveTimeouts.delete(cleanRoomId);
              }
              console.log(`[Socket.io] Room "${cleanRoomId}" is now empty and removed from transient memory.`);
            });
          }
        }
      }

      socket.leave(cleanRoomId);
      if (currentRoomId === cleanRoomId) {
        currentRoomId = null;
      }
    };

    /**
     * Screen Share: Request to start sharing
     * Server enforces one-sharer-per-room rule
     */
    socket.on('screen-share-request', ({ roomId }) => {
      const cleanRoomId = (roomId || currentRoomId || '').trim().toUpperCase();
      if (!cleanRoomId || !rooms.has(cleanRoomId)) {
        socket.emit('screen-share-denied', { reason: 'Room not found.' });
        return;
      }

      // Ensure the requesting socket is actually in the room
      const roomParticipants = rooms.get(cleanRoomId);
      if (!roomParticipants.has(socket.id)) {
        socket.emit('screen-share-denied', { reason: 'You are not in this room.' });
        return;
      }

      // Check if someone is already sharing
      if (screenSharers.has(cleanRoomId)) {
        const currentSharer = screenSharers.get(cleanRoomId);
        console.log(
          `[Socket.io] Screen share denied for "${socket.user.name}" — "${currentSharer.userName}" is already sharing in room "${cleanRoomId}".`
        );
        socket.emit('screen-share-denied', {
          reason: `${currentSharer.userName} is already sharing their screen.`,
          sharerName: currentSharer.userName,
        });
        return;
      }

      // Register this socket as the active screen sharer
      screenSharers.set(cleanRoomId, {
        socketId: socket.id,
        userId: socket.user.id,
        userName: socket.user.name,
      });

      console.log(
        `[Socket.io] Screen share started by "${socket.user.name}" in room "${cleanRoomId}".`
      );

      // Notify everyone in the room (including the sharer) that sharing has started
      io.to(cleanRoomId).emit('screen-share-started', {
        roomId: cleanRoomId,
        socketId: socket.id,
        userId: socket.user.id,
        userName: socket.user.name,
      });
    });

    /**
     * Screen Share: Stop sharing
     */
    socket.on('screen-share-stop', ({ roomId }) => {
      const cleanRoomId = (roomId || currentRoomId || '').trim().toUpperCase();
      if (!cleanRoomId) return;

      // Only the active sharer can stop sharing
      if (screenSharers.has(cleanRoomId) && screenSharers.get(cleanRoomId).socketId === socket.id) {
        screenSharers.delete(cleanRoomId);
        console.log(
          `[Socket.io] Screen share stopped by "${socket.user.name}" in room "${cleanRoomId}".`
        );

        io.to(cleanRoomId).emit('screen-share-stopped', {
          roomId: cleanRoomId,
          socketId: socket.id,
          userId: socket.user.id,
          userName: socket.user.name,
        });
      }
    });

    /**
     * Handle explicit leave-room request
     */
    socket.on('leave-room', ({ roomId }) => {
      leaveRoomHandler(roomId || currentRoomId);
    });

    /**
     * Handle End Meeting request (Host Only)
     */
    socket.on('end-meeting', async ({ roomId }) => {
      const cleanRoomId = (roomId || currentRoomId || '').trim().toUpperCase();
      if (!cleanRoomId) return;

      try {
        const meeting = await Meeting.findOne({ roomId: cleanRoomId });
        if (!meeting) {
          socket.emit('error-message', { message: 'Meeting not found' });
          return;
        }

        // Verify host ownership
        if (meeting.host.toString() !== socket.user.id) {
          socket.emit('error-message', { message: 'Only the meeting host can end this meeting.' });
          return;
        }

        const now = new Date();
        meeting.status = 'ended';
        meeting.endedAt = now;
        meeting.participants.forEach((p) => {
          if (!p.leftAt) p.leftAt = now;
        });
        await meeting.save();

        console.log(`[Socket.io] Meeting "${cleanRoomId}" ended by Host ${socket.user.name}`);

        // Broadcast to all participants in room
        io.to(cleanRoomId).emit('meeting-ended', {
          roomId: cleanRoomId,
          message: 'The meeting has been ended by the host.',
        });

        // Save whiteboard one last time immediately
        await saveWhiteboardToDB(cleanRoomId, true);

        // Clean up transient memory (including any active screen share)
        rooms.delete(cleanRoomId);
        screenSharers.delete(cleanRoomId);
        whiteboardStrokes.delete(cleanRoomId);
        if (whiteboardSaveTimeouts.has(cleanRoomId)) {
           clearTimeout(whiteboardSaveTimeouts.get(cleanRoomId));
           whiteboardSaveTimeouts.delete(cleanRoomId);
        }

        // Remove all sockets from the room
        const roomSockets = await io.in(cleanRoomId).fetchSockets();
        for (const s of roomSockets) {
          s.leave(cleanRoomId);
        }
      } catch (err) {
        console.error('[Socket.io] Error ending meeting via socket:', err);
        socket.emit('error-message', { message: 'Failed to end meeting' });
      }
    });

    /**
     * Handle Disconnection
     */
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (User: ${socket.user?.name}, Reason: ${reason})`);
      if (currentRoomId) {
        leaveRoomHandler(currentRoomId);
      }

      // Check all rooms in case socket was in any untracked room
      for (const [rId, roomParticipants] of rooms.entries()) {
        if (roomParticipants.has(socket.id)) {
          leaveRoomHandler(rId);
        }
      }
    });
  });
}

