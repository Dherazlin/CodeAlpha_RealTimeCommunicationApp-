import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';
import MeetingFile from '../models/MeetingFile.js';
import connectDB from '../config/db.js';
import dotenv from 'dotenv';

// Use dynamic import for node-fetch to support both node environments seamlessly
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FormData = (...args) => import('form-data').then(({default: FormData}) => new FormData(...args));

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('\n=== KORUS FILE SHARING TEST SUITE ===\n');

  try {
    // 1. Health check
    console.log('[1/5] Checking server health...');
    const healthRes = await fetch(`${API_URL}/health`);
    if (!healthRes.ok) throw new Error('Backend server is not running on port 5000');
    console.log('  ✓ Backend server is running and healthy\n');

    // 2. Setup users and meeting
    console.log('[2/5] Creating test users and meeting...');
    
    const userA_res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'File Test A', email: `file_a_${Date.now()}@test.com`, password: 'password123' })
    });
    const userA = await userA_res.json();

    const userB_res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'File Test B', email: `file_b_${Date.now()}@test.com`, password: 'password123' })
    });
    const userB = await userB_res.json();

    const nonParticipant_res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'File Test C', email: `file_c_${Date.now()}@test.com`, password: 'password123' })
    });
    const nonParticipant = await nonParticipant_res.json();

    // User A creates a meeting
    const createRes = await fetch(`${API_URL}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userA.token}` },
      body: JSON.stringify({ title: 'File Sharing Test Meeting' })
    });
    const { meeting } = await createRes.json();
    console.log(`  ✓ Created meeting: ${meeting.roomId}`);

    // Wait for DB to catch up slightly just in case
    await new Promise(r => setTimeout(r, 500));

    // 3. Test File Upload (GridFS)
    console.log('\n[3/5] Testing File Upload to GridFS...');
    
    // Create a temporary file
    const testFilePath = path.join(__dirname, 'test_upload.txt');
    fs.writeFileSync(testFilePath, 'Hello World! This is a test file for Korus.');

    const fileStream = fs.createReadStream(testFilePath);
    
    const FormDataType = (await import('form-data')).default;
    const formData = new FormDataType();
    formData.append('file', fileStream);

    const uploadRes = await fetch(`${API_URL}/meetings/${meeting.roomId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userA.token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error(`Upload failed: ${uploadData.message}`);
    console.log('  ✓ File uploaded successfully via API');
    console.log(`  ✓ File metadata saved: ID ${uploadData.file._id}, GridFS ID: ${uploadData.file.gridFsId}`);

    // Clean up local temp file
    fs.unlinkSync(testFilePath);

    // 4. Test File List & Download Authorization
    console.log('\n[4/5] Testing Authorization & Retrieval...');

    // User B attempts to view files (Should fail because B hasn't joined via socket or DB yet)
    // Wait, the API check relies on `isParticipant`. User B isn't in `meeting.participants`.
    const listResB_fail = await fetch(`${API_URL}/meetings/${meeting.roomId}/files`, {
      headers: { 'Authorization': `Bearer ${userB.token}` }
    });
    if (listResB_fail.status !== 403) throw new Error('User B should be rejected (not participant)');
    console.log('  ✓ Verified non-participant (User B) cannot list files');

    // Force add User B as participant directly in DB for testing
    await connectDB();
    const dbMeeting = await Meeting.findOne({ roomId: meeting.roomId });
    dbMeeting.participants.push({ user: userB.user.id, joinedAt: new Date() });
    await dbMeeting.save();

    const listResB_pass = await fetch(`${API_URL}/meetings/${meeting.roomId}/files`, {
      headers: { 'Authorization': `Bearer ${userB.token}` }
    });
    const listDataB = await listResB_pass.json();
    if (!listDataB.success || listDataB.files.length !== 1) throw new Error('User B failed to list files after joining');
    console.log('  ✓ Verified participant (User B) can list files');

    // Non-participant (User C) tries to upload
    const formDataC = new FormDataType();
    formDataC.append('file', Buffer.from('Hack'), { filename: 'hack.txt', contentType: 'text/plain' });
    
    const uploadResC = await fetch(`${API_URL}/meetings/${meeting.roomId}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${nonParticipant.token}`, ...formDataC.getHeaders() },
      body: formDataC
    });
    if (uploadResC.status !== 403) throw new Error('Non-participant should be forbidden from uploading');
    console.log('  ✓ Verified non-participant (User C) cannot upload files');

    // 5. Test Download File
    console.log('\n[5/5] Testing GridFS Download streaming...');
    const fileId = listDataB.files[0]._id;
    
    const downloadRes = await fetch(`${API_URL}/meetings/${meeting.roomId}/files/${fileId}/download?token=${userA.token}`);
    if (!downloadRes.ok) throw new Error(`Download failed with status ${downloadRes.status}`);
    
    const downloadedText = await downloadRes.text();
    if (downloadedText !== 'Hello World! This is a test file for Korus.') {
      throw new Error(`Downloaded content mismatch: "${downloadedText}"`);
    }
    console.log('  ✓ Downloaded file content matches original exactly');
    console.log(`  ✓ Content-Type: ${downloadRes.headers.get('content-type')}`);
    
    console.log('\n=== ALL FILE SHARING TESTS PASSED! ===\n');

  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
