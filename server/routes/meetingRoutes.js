import express from 'express';
import {
  createMeeting,
  getMeetingByRoomId,
  getLiveMeetings,
  getMyMeetings,
  joinMeeting,
  leaveMeeting,
  endMeeting,
} from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection to all meeting endpoints
router.use(protect);

// Meeting Collection Endpoints
router.route('/')
  .post(createMeeting);

router.route('/live')
  .get(getLiveMeetings);

router.route('/my-meetings')
  .get(getMyMeetings);

// Single Meeting Room Operations
router.route('/:roomId')
  .get(getMeetingByRoomId);

router.route('/:roomId/join')
  .post(joinMeeting);

router.route('/:roomId/leave')
  .post(leaveMeeting);

router.route('/:roomId/end')
  .post(endMeeting);

export default router;
