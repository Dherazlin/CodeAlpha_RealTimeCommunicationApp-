import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=== KORUS PHASE 3 REAL-TIME SOCKET.IO TEST SUITE ===\n');

  // Step 1: Health check
  console.log('[1/6] Checking server health...');
  const healthRes = await fetch(`${API_URL}/health`);
  const healthData = await healthRes.json();
  console.log('  Health check result:', healthData);
  if (!healthData.success) throw new Error('Server health check failed');

  // Step 2: Register two test users
  console.log('\n[2/6] Registering test users...');
  const rand = Math.floor(Math.random() * 10000);
  const user1Email = `alice_${rand}@example.com`;
  const user2Email = `bob_${rand}@example.com`;

  const reg1Res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Walker', email: user1Email, password: 'password123' }),
  });
  const user1Data = await reg1Res.json();
  console.log('  User 1 (Alice):', user1Data.user?.name, 'Token received:', Boolean(user1Data.token));

  const reg2Res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob Roberts', email: user2Email, password: 'password123' }),
  });
  const user2Data = await reg2Res.json();
  console.log('  User 2 (Bob):', user2Data.user?.name, 'Token received:', Boolean(user2Data.token));

  if (!user1Data.token || !user2Data.token) {
    throw new Error('Failed to register test users');
  }

  // Create meeting in MongoDB Atlas as User 1
  const meetingRes = await fetch(`${API_URL}/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user1Data.token}`,
    },
    body: JSON.stringify({
      title: 'Real-time Test Meeting',
      category: 'general',
    }),
  });
  const meetingData = await meetingRes.json();
  const roomId = meetingData.meeting.roomId;
  console.log(`\n[3/6] Created meeting "${roomId}" in MongoDB. Connecting via Socket.io...`);

  // Step 3: Connect User 1 socket
  const socket1 = io(SOCKET_URL, {
    auth: { token: user1Data.token },
    transports: ['websocket', 'polling'],
  });

  const user1JoinedPromise = new Promise((resolve) => {
    socket1.on('room-users', (data) => {
      console.log(`  [Alice] Received initial room-users: count = ${data.participants.length}`);
      resolve(data);
    });
  });

  socket1.on('connect', () => {
    console.log('  [Alice] Socket connected successfully:', socket1.id);
    socket1.emit('join-room', { roomId });
  });

  await user1JoinedPromise;

  // Step 4: Connect User 2 socket and verify presence
  console.log('\n[4/6] Connecting Bob to the same room and verifying presence...');
  const socket2 = io(SOCKET_URL, {
    auth: { token: user2Data.token },
    transports: ['websocket', 'polling'],
  });

  const aliceSeesBobPromise = new Promise((resolve) => {
    socket1.on('participant-joined', (data) => {
      console.log(`  [Alice] Received participant-joined event:`, data.participant.name, `(${data.participant.role})`);
      resolve(data.participant);
    });
  });

  const bobRoomUsersPromise = new Promise((resolve) => {
    socket2.on('room-users', (data) => {
      console.log(`  [Bob] Received room-users: count = ${data.participants.length}`);
      resolve(data);
    });
  });

  socket2.on('connect', () => {
    console.log('  [Bob] Socket connected successfully:', socket2.id);
    socket2.emit('join-room', { roomId });
  });

  const [joinedParticipant, bobRoomUsers] = await Promise.all([
    aliceSeesBobPromise,
    bobRoomUsersPromise,
  ]);

  if (joinedParticipant.name !== 'Bob Roberts') {
    throw new Error('Alice did not receive correct participant info for Bob');
  }
  if (bobRoomUsers.participants.length !== 2) {
    throw new Error('Bob did not receive 2 participants in room-users');
  }
  console.log('  ✓ Presence verified: Both Alice and Bob are visible in the room!');

  // Step 5: Test Real-Time Chat
  console.log('\n[5/6] Testing real-time chat...');
  const chatPromise1 = new Promise((resolve) => {
    socket1.on('receive-message', (msg) => {
      console.log(`  [Alice] Received chat message from "${msg.userName}": "${msg.text}"`);
      resolve(msg);
    });
  });

  const chatPromise2 = new Promise((resolve) => {
    socket2.on('receive-message', (msg) => {
      console.log(`  [Bob] Received chat message from "${msg.userName}": "${msg.text}"`);
      resolve(msg);
    });
  });

  // Bob sends message
  socket2.emit('send-message', {
    roomId,
    message: 'Hello Alice! Testing Phase 3 real-time chat.',
  });

  const [msg1, msg2] = await Promise.all([chatPromise1, chatPromise2]);
  if (msg1.text !== 'Hello Alice! Testing Phase 3 real-time chat.' || msg2.text !== msg1.text) {
    throw new Error('Chat message broadcast mismatch');
  }
  console.log('  ✓ Real-time chat verified: Message received simultaneously by both participants!');

  // Step 6: Test User Leaving & Unauthenticated Rejection
  console.log('\n[6/6] Testing participant departure and unauthenticated rejection...');
  const bobLeftPromise = new Promise((resolve) => {
    socket1.on('participant-left', (data) => {
      console.log(`  [Alice] Received participant-left: "${data.userName}", remaining: ${data.remainingCount}`);
      resolve(data);
    });
  });

  socket2.emit('leave-room', { roomId });
  socket2.disconnect();

  const leftData = await bobLeftPromise;
  if (leftData.remainingCount !== 1) {
    throw new Error('Expected remainingCount to be 1 after Bob left');
  }
  console.log('  ✓ Departure event verified!');

  // Test unauthenticated socket
  const badSocket = io(SOCKET_URL, {
    auth: { token: 'invalid_token_123' },
    transports: ['websocket', 'polling'],
  });

  const rejectionPromise = new Promise((resolve) => {
    badSocket.on('connect_error', (err) => {
      console.log('  [Security] Unauthenticated connection properly rejected:', err.message);
      badSocket.disconnect();
      resolve(true);
    });
  });

  await rejectionPromise;
  console.log('  ✓ Authentication security verified: Invalid tokens are rejected.');

  socket1.disconnect();
  console.log('\n=== ALL PHASE 3 REAL-TIME SOCKET TESTS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
