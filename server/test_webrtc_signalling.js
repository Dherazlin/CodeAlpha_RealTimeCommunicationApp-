import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runWebRTCSignallingTests() {
  console.log('=== KORUS PHASE 4 WEBRTC SIGNALLING TEST SUITE ===\n');

  // Step 1: Health check
  console.log('[1/6] Checking server health...');
  const healthRes = await fetch(`${API_URL}/health`);
  const healthData = await healthRes.json();
  if (!healthData.success) throw new Error('Server health check failed');
  console.log('  ✓ Backend server is running and healthy');

  // Step 2: Register two users (Alice and Bob)
  console.log('\n[2/6] Registering test participants (Alice & Bob)...');
  const rand = Math.floor(Math.random() * 10000);
  const user1Email = `alice_webrtc_${rand}@example.com`;
  const user2Email = `bob_webrtc_${rand}@example.com`;

  const reg1 = await (await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Walker', email: user1Email, password: 'password123' }),
  })).json();

  const reg2 = await (await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob Roberts', email: user2Email, password: 'password123' }),
  })).json();

  console.log('  ✓ Alice token:', Boolean(reg1.token), '| Bob token:', Boolean(reg2.token));

  const roomId = `KOR-W${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`\n[3/6] Connecting Alice and Bob to room "${roomId}"...`);

  // Step 3: Connect Alice and Bob sockets
  const socketAlice = io(SOCKET_URL, {
    auth: { token: reg1.token },
    transports: ['websocket', 'polling'],
  });

  await new Promise((resolve) => {
    socketAlice.on('connect', () => {
      socketAlice.emit('join-room', { roomId });
      socketAlice.on('room-users', () => resolve(true));
    });
  });
  console.log('  ✓ Alice in room:', socketAlice.id);

  const socketBob = io(SOCKET_URL, {
    auth: { token: reg2.token },
    transports: ['websocket', 'polling'],
  });

  const aliceSeesBobPromise = new Promise((resolve) => {
    socketAlice.on('participant-joined', ({ participant }) => {
      resolve(participant);
    });
  });

  await new Promise((resolve) => {
    socketBob.on('connect', () => {
      socketBob.emit('join-room', { roomId });
      socketBob.on('room-users', () => resolve(true));
    });
  });

  const joinedBob = await aliceSeesBobPromise;
  console.log('  ✓ Bob joined room:', socketBob.id, '| Alice notified of:', joinedBob.name);

  // Step 4: Test WebRTC Offer & Answer Signalling Relay
  console.log('\n[4/6] Testing WebRTC Offer / Answer Signalling Relay...');

  const mockSDPOffer = { type: 'offer', sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  const mockSDPAnswer = { type: 'answer', sdp: 'v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };

  const bobReceivesOfferPromise = new Promise((resolve) => {
    socketBob.on('webrtc-offer', (payload) => {
      console.log('  [Bob] Received WebRTC offer from sender:', payload.senderSocketId);
      resolve(payload);
    });
  });

  // Alice sends WebRTC offer to Bob
  socketAlice.emit('webrtc-offer', {
    targetSocketId: socketBob.id,
    offer: mockSDPOffer,
    roomId,
  });

  const receivedOfferPayload = await bobReceivesOfferPromise;
  if (receivedOfferPayload.offer.sdp !== mockSDPOffer.sdp || receivedOfferPayload.senderSocketId !== socketAlice.id) {
    throw new Error('Offer relay mismatch');
  }
  console.log('  ✓ WebRTC Offer relayed correctly from Alice to Bob');

  const aliceReceivesAnswerPromise = new Promise((resolve) => {
    socketAlice.on('webrtc-answer', (payload) => {
      console.log('  [Alice] Received WebRTC answer from sender:', payload.senderSocketId);
      resolve(payload);
    });
  });

  // Bob sends WebRTC answer to Alice
  socketBob.emit('webrtc-answer', {
    targetSocketId: socketAlice.id,
    answer: mockSDPAnswer,
    roomId,
  });

  const receivedAnswerPayload = await aliceReceivesAnswerPromise;
  if (receivedAnswerPayload.answer.sdp !== mockSDPAnswer.sdp || receivedAnswerPayload.senderSocketId !== socketBob.id) {
    throw new Error('Answer relay mismatch');
  }
  console.log('  ✓ WebRTC Answer relayed correctly from Bob to Alice');

  // Step 5: Test WebRTC ICE Candidate Relay
  console.log('\n[5/6] Testing WebRTC ICE Candidate Relay...');

  const mockCandidate = { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 };

  const bobReceivesCandidatePromise = new Promise((resolve) => {
    socketBob.on('webrtc-ice-candidate', (payload) => {
      console.log('  [Bob] Received ICE candidate from:', payload.senderSocketId);
      resolve(payload);
    });
  });

  socketAlice.emit('webrtc-ice-candidate', {
    targetSocketId: socketBob.id,
    candidate: mockCandidate,
    roomId,
  });

  const receivedCandidate = await bobReceivesCandidatePromise;
  if (receivedCandidate.candidate.candidate !== mockCandidate.candidate) {
    throw new Error('ICE candidate relay mismatch');
  }
  console.log('  ✓ WebRTC ICE candidate relayed accurately');

  // Step 6: Test Media Track State Synchronization (Mute / Camera Toggle)
  console.log('\n[6/6] Testing Media Track State Synchronization (Mute / Camera Off)...');

  const bobReceivesMediaTogglePromise = new Promise((resolve) => {
    socketBob.on('user-toggle-media', (payload) => {
      console.log('  [Bob] Received media toggle from Alice:', payload);
      resolve(payload);
    });
  });

  socketAlice.emit('user-toggle-media', {
    roomId,
    isMicOn: false,
    isCameraOn: false,
  });

  const mediaTogglePayload = await bobReceivesMediaTogglePromise;
  if (mediaTogglePayload.isMicOn !== false || mediaTogglePayload.isCameraOn !== false) {
    throw new Error('Media toggle sync mismatch');
  }
  console.log('  ✓ Media track state toggle synced properly');

  // Cleanup sockets
  socketAlice.disconnect();
  socketBob.disconnect();

  console.log('\n=== ALL PHASE 4 WEBRTC SIGNALLING & MEDIA TESTS PASSED! ===\n');
}

runWebRTCSignallingTests().catch((err) => {
  console.error('\n❌ WebRTC test failed:', err);
  process.exit(1);
});
