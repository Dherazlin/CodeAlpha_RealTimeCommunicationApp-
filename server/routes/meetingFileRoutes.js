import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import Meeting from '../models/Meeting.js';
import MeetingFile from '../models/MeetingFile.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Use memory storage for multer since we'll stream directly to GridFS
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Basic file type validation (can be expanded)
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/zip',
      'application/x-zip-compressed'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  },
});

// Helper to check if user is participant (host or member)
const isParticipant = (meeting, userId) => {
  if (meeting.host.toString() === userId) return true;
  return meeting.participants.some(p => p.user.toString() === userId);
};

// POST /api/meetings/:roomId/files
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (!isParticipant(meeting, req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not a participant in this meeting' });
    }

    // Stream file buffer to GridFS
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'meetingFiles',
    });

    // Create a write stream
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { meetingId: meeting._id, uploadedBy: req.user._id },
    });

    // Write buffer to stream
    uploadStream.end(file.buffer);

    uploadStream.on('error', (error) => {
      console.error('[File Sharing] GridFS upload error:', error);
      res.status(500).json({ success: false, message: 'File upload failed' });
    });

    uploadStream.on('finish', async () => {
      // Create metadata document
      const meetingFile = await MeetingFile.create({
        meetingId: meeting._id,
        uploadedBy: req.user._id,
        uploaderName: req.user.name,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        gridFsId: uploadStream.id,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        file: meetingFile,
      });
    });
  } catch (error) {
    console.error('[File Sharing] Upload route error:', error);
    if (error.message && error.message.includes('Unsupported file type')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File exceeds 10MB limit' });
    }
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
});

// GET /api/meetings/:roomId/files
router.get('/', protect, async (req, res) => {
  try {
    const { roomId } = req.params;

    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (!isParticipant(meeting, req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not a participant in this meeting' });
    }

    const files = await MeetingFile.find({ meetingId: meeting._id }).sort({ createdAt: -1 });

    res.json({ success: true, files });
  } catch (error) {
    console.error('[File Sharing] List route error:', error);
    res.status(500).json({ success: false, message: 'Server error listing files' });
  }
});

// GET /api/meetings/:roomId/files/:fileId/download
router.get('/:fileId/download', protect, async (req, res) => {
  try {
    const { roomId, fileId } = req.params;

    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    if (!isParticipant(meeting, req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not a participant in this meeting' });
    }

    const meetingFile = await MeetingFile.findOne({ _id: fileId, meetingId: meeting._id });
    if (!meetingFile) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'meetingFiles',
    });

    res.set('Content-Type', meetingFile.mimeType);
    res.set('Content-Disposition', `attachment; filename="${meetingFile.originalName}"`);
    res.set('Content-Length', meetingFile.size);

    const downloadStream = bucket.openDownloadStream(meetingFile.gridFsId);

    downloadStream.on('error', (error) => {
      console.error('[File Sharing] GridFS download error:', error);
      res.status(500).json({ success: false, message: 'Error streaming file' });
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('[File Sharing] Download route error:', error);
    res.status(500).json({ success: false, message: 'Server error downloading file' });
  }
});

export default router;
