import Meeting from '../models/Meeting.js';

/**
 * Generate a unique Room ID in format KOR-XXXX
 */
const generateUniqueRoomId = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let isUnique = false;
  let roomId = '';

  while (!isUnique) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    roomId = `KOR-${code}`;
    const existing = await Meeting.findOne({ roomId });
    if (!existing) {
      isUnique = true;
    }
  }

  return roomId;
};

/**
 * @desc    Create a new meeting
 * @route   POST /api/meetings
 * @access  Private (Authenticated User)
 */
export const createMeeting = async (req, res) => {
  try {
    const { title, description, category, privacy, customRoomId } = req.body;

    let roomId = customRoomId ? customRoomId.trim().toUpperCase() : await generateUniqueRoomId();

    // Validate customRoomId format if provided: alphanumeric + dashes only, max 20 chars
    if (customRoomId) {
      if (!/^[A-Z0-9-]{1,20}$/.test(roomId)) {
        return res.status(400).json({
          success: false,
          message: 'Custom Room ID must be 1–20 characters, letters, numbers, or dashes only.',
        });
      }
      const existing = await Meeting.findOne({ roomId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Room ID "${roomId}" is already in use. Please choose another or generate one automatically.`,
        });
      }
    }

    const meeting = await Meeting.create({
      roomId,
      title: title?.trim() || 'New Meeting',
      description: description?.trim() || '',
      category: category?.trim() || 'general',
      privacy: privacy === 'org' ? 'org' : 'public',
      host: req.user._id,
      status: 'live',
      startedAt: new Date(),
      participants: [
        {
          user: req.user._id,
          joinedAt: new Date(),
        },
      ],
    });

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('host', 'name email avatar role')
      .populate('participants.user', 'name email avatar role');

    return res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting: populatedMeeting,
    });
  } catch (error) {
    console.error('[Meeting Controller] createMeeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create meeting. Please try again.',
    });
  }
};

/**
 * @desc    Get meeting by Room ID
 * @route   GET /api/meetings/:roomId
 * @access  Private
 */
export const getMeetingByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required',
      });
    }

    const cleanRoomId = roomId.trim().toUpperCase();
    const meeting = await Meeting.findOne({ roomId: cleanRoomId })
      .populate('host', 'name email avatar role')
      .populate('participants.user', 'name email avatar role');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: `Meeting with Room ID "${cleanRoomId}" does not exist`,
      });
    }

    return res.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('[Meeting Controller] getMeetingByRoomId error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch meeting',
    });
  }
};

/**
 * @desc    Get all currently active / live meetings
 * @route   GET /api/meetings/live
 * @access  Private
 */
export const getLiveMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ status: 'live' })
      .sort({ startedAt: -1, createdAt: -1 })
      .populate('host', 'name email avatar role')
      .populate('participants.user', 'name email avatar role');

    return res.json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error('[Meeting Controller] getLiveMeetings error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch live meetings',
    });
  }
};

/**
 * @desc    Get user meeting history (meetings hosted or participated in)
 * @route   GET /api/meetings/my-meetings
 * @access  Private
 */
export const getMyMeetings = async (req, res) => {
  try {
    const userId = req.user._id;

    // Return meetings where current user is host OR participated
    const meetings = await Meeting.find({
      $or: [{ host: userId }, { 'participants.user': userId }],
    })
      .sort({ createdAt: -1 })
      .populate('host', 'name email avatar role')
      .populate('participants.user', 'name email avatar role');

    return res.json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error('[Meeting Controller] getMyMeetings error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user meetings',
    });
  }
};

/**
 * @desc    Join meeting & record participation
 * @route   POST /api/meetings/:roomId/join
 * @access  Private
 */
export const joinMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const cleanRoomId = roomId.trim().toUpperCase();

    const meeting = await Meeting.findOne({ roomId: cleanRoomId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: `Meeting "${cleanRoomId}" not found`,
      });
    }

    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'This meeting has already ended and cannot be joined',
      });
    }

    const userIdStr = req.user._id.toString();

    // Check if user has an existing participant record
    const existingIndex = meeting.participants.findIndex(
      (p) => p.user && p.user.toString() === userIdStr
    );

    if (existingIndex !== -1) {
      // User already exists in participants: clear leftAt to mark as currently active
      meeting.participants[existingIndex].leftAt = null;
    } else {
      // New participant joining
      meeting.participants.push({
        user: req.user._id,
        joinedAt: new Date(),
      });
    }

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('host', 'name email avatar role')
      .populate('participants.user', 'name email avatar role');

    return res.json({
      success: true,
      message: 'Joined meeting successfully',
      meeting: populatedMeeting,
    });
  } catch (error) {
    console.error('[Meeting Controller] joinMeeting error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to join meeting',
    });
  }
};

/**
 * @desc    Leave meeting & update leftAt timestamp
 * @route   POST /api/meetings/:roomId/leave
 * @access  Private
 */
export const leaveMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const cleanRoomId = roomId.trim().toUpperCase();

    const meeting = await Meeting.findOne({ roomId: cleanRoomId });

    if (meeting) {
      const userIdStr = req.user._id.toString();
      const participant = meeting.participants.find(
        (p) => p.user && p.user.toString() === userIdStr && !p.leftAt
      );

      if (participant) {
        participant.leftAt = new Date();
        await meeting.save();
      }
    }

    return res.json({
      success: true,
      message: 'Left meeting successfully',
    });
  } catch (error) {
    console.error('[Meeting Controller] leaveMeeting error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record leaving meeting',
    });
  }
};

/**
 * @desc    End meeting (Host only)
 * @route   POST /api/meetings/:roomId/end
 * @access  Private (Host only)
 */
export const endMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const cleanRoomId = roomId.trim().toUpperCase();

    const meeting = await Meeting.findOne({ roomId: cleanRoomId });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: `Meeting "${cleanRoomId}" not found`,
      });
    }

    // Verify host ownership
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the original meeting host can end this meeting',
      });
    }

    const now = new Date();
    meeting.status = 'ended';
    meeting.endedAt = now;

    // Set leftAt for all participants who hadn't left yet
    meeting.participants.forEach((p) => {
      if (!p.leftAt) {
        p.leftAt = now;
      }
    });

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('host', 'name email avatar role')
      .populate('participants.user', 'name email avatar role');

    return res.json({
      success: true,
      message: 'Meeting ended successfully',
      meeting: populatedMeeting,
    });
  } catch (error) {
    console.error('[Meeting Controller] endMeeting error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to end meeting',
    });
  }
};
