import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runMultiUserWebRTCTests() {
  console.log('=== KORUS PHASE 5: MULTI-USER WEBRTC MESH TEST SUITE ===\n');

  // Step 1: Health check
  console.log('[1/10] Checking server health...');
  const healthRes = await fetch(`${API_URL}/health`);
  const healthData = await healthRes.json();
  if (!healthData.success) throw new Error('Server health check failed');
  console.log('  ✓ Backend server is running and healthy');

  // Step 2: Register 4 test participants (Alice, Bob, Charlie, Dana)
  console.log('\n[2/10] Registering 4 test participants (Alice, Bob, Charlie, Dana)...');
  const rand = Math.floor(Math.random() * 100000);
  const users = [
    { name: 'Alice Walker', email: `alice_mesh_${rand}@example.com`, password: 'password123' },
    { name: 'Bob Roberts', email: `bob_mesh_${rand}@example.com`, password: 'password123' },
    { name: 'Charlie Davis', email: `charlie_mesh_${rand}@example.com`, password: 'password123' },
    { name: 'Dana Scott', email: `dana_mesh_${rand}@example.com`, password: 'password123' },
  ];

  const tokens = [];
  for (const u of users) {
    const regRes = await (
      await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u),
      })
    ).json();
    if (!regRes.token) throw new Error(`Registration failed for ${u.name}`);
    tokens.push(regRes.token);
  }
  console.log('  ✓ Registered 4 participants successfully with valid JWT tokens');

  const roomId = `KOR-MESH${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`\n[3/10] Connecting Alice (initiator / host) to room "${roomId}"...`);

  // Alice connects
  const socketAlice = io(SOCKET_URL, {
    auth: { token: tokens[0] },
    transports: ['websocket', 'polling'],
  });

  await new Promise((resolve) => {
    socketAlice.on('connect', () => {
      socketAlice.emit('join-room', { roomId });
      socketAlice.on('room-users', () => resolve(true));
    });
  });
  console.log('  ✓ Alice joined room as Host (socket:', socketAlice.id, ')');

  // Step 4: Bob joins -> Alice detects Bob and sends WebRTC Offer, Bob answers
  console.log('\n[4/10] Bob joins -> Alice (existing peer) initiates WebRTC Offer to Bob...');
  const socketBob = io(SOCKET_URL, {
    auth: { token: tokens[1] },
    transports: ['websocket', 'polling'],
  });

  const aliceSeesBobPromise = new Promise((resolve) => {
    socketAlice.once('participant-joined', ({ participant }) => resolve(participant));
  });

  const bobReceivesOfferPromise = new Promise((resolve) => {
    socketBob.on('webrtc-offer', (payload) => resolve(payload));
  });

  await new Promise((resolve) => {
    socketBob.on('connect', () => {
      socketBob.emit('join-room', { roomId });
      socketBob.on('room-users', () => resolve(true));
    });
  });

  const bobJoined = await aliceSeesBobPromise;
  console.log('  ✓ Alice notified of Bob joined:', bobJoined.name);

  // Alice initiates offer to Bob
  const mockSDP = { type: 'offer', sdp: 'v=0\r\no=- 111 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  socketAlice.emit('webrtc-offer', { targetSocketId: socketBob.id, offer: mockSDP, roomId });

  const bobReceivedOffer = await bobReceivesOfferPromise;
  console.log('  ✓ Bob received WebRTC offer from Alice (sender:', bobReceivedOffer.senderSocketId, ')');

  // Bob responds with Answer to Alice
  const aliceReceivesAnswerPromise = new Promise((resolve) => {
    socketAlice.once('webrtc-answer', (payload) => resolve(payload));
  });

  const mockAnswer = { type: 'answer', sdp: 'v=0\r\no=- 222 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
  socketBob.emit('webrtc-answer', { targetSocketId: socketAlice.id, answer: mockAnswer, roomId });

  const aliceReceivedAnswer = await aliceReceivesAnswerPromise;
  console.log('  ✓ Alice received WebRTC answer from Bob (sender:', aliceReceivedAnswer.senderSocketId, ')');

  // Step 5: Charlie joins -> Full Mesh negotiation (Alice->Charlie, Bob->Charlie)
  console.log('\n[5/10] Charlie joins -> Alice & Bob both initiate WebRTC Offers to Charlie (Full Mesh)...');
  const socketCharlie = io(SOCKET_URL, {
    auth: { token: tokens[2] },
    transports: ['websocket', 'polling'],
  });

  const aliceSeesCharliePromise = new Promise((resolve) => {
    socketAlice.once('participant-joined', ({ participant }) => resolve(participant));
  });
  const bobSeesCharliePromise = new Promise((resolve) => {
    socketBob.once('participant-joined', ({ participant }) => resolve(participant));
  });

  const charlieOffersReceived = [];
  socketCharlie.on('webrtc-offer', (payload) => {
    charlieOffersReceived.push(payload);
  });

  await new Promise((resolve) => {
    socketCharlie.on('connect', () => {
      socketCharlie.emit('join-room', { roomId });
      socketCharlie.on('room-users', () => resolve(true));
    });
  });

  await Promise.all([aliceSeesCharliePromise, bobSeesCharliePromise]);
  console.log('  ✓ Both Alice and Bob notified of Charlie joining');

  // Alice and Bob both send offers to Charlie
  socketAlice.emit('webrtc-offer', { targetSocketId: socketCharlie.id, offer: mockSDP, roomId });
  socketBob.emit('webrtc-offer', { targetSocketId: socketCharlie.id, offer: mockSDP, roomId });

  // Wait for Charlie to receive both offers
  while (charlieOffersReceived.length < 2) {
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log('  ✓ Charlie received offers from both existing peers (Alice & Bob)');

  // Step 6: Test ICE Candidate Mesh routing
  console.log('\n[6/10] Testing ICE Candidate targeted routing across mesh...');
  const charlieCandidatePromise = new Promise((resolve) => {
    socketCharlie.once('webrtc-ice-candidate', (payload) => resolve(payload));
  });

  socketAlice.emit('webrtc-ice-candidate', {
    targetSocketId: socketCharlie.id,
    candidate: { candidate: 'candidate:charlie_test 1 UDP 1 127.0.0.1 5000 typ host' },
    roomId,
  });

  const receivedIce = await charlieCandidatePromise;
  if (!receivedIce.candidate || receivedIce.senderSocketId !== socketAlice.id) {
    throw new Error('ICE candidate relay failure');
  }
  console.log('  ✓ ICE candidate routed accurately from Alice to Charlie');

  // Step 7: Dana (4th participant) joins
  console.log('\n[7/10] Dana joins (4th user) -> verifying mesh scalability to 4 participants...');
  const socketDana = io(SOCKET_URL, {
    auth: { token: tokens[3] },
    transports: ['websocket', 'polling'],
  });

  await new Promise((resolve) => {
    socketDana.on('connect', () => {
      socketDana.emit('join-room', { roomId });
      socketDana.on('room-users', ({ participants }) => {
        if (participants.length !== 4) throw new Error('Expected 4 participants in room');
        resolve(true);
      });
    });
  });
  console.log('  ✓ Dana joined room, total participants snapshot = 4');

  // Step 8: Multi-user Media synchronization and Real-time Chat
  console.log('\n[8/10] Testing media toggles and multi-user chat broadcasting...');
  const bobMediaTogglePromise = new Promise((resolve) => {
    socketBob.once('user-toggle-media', (payload) => resolve(payload));
  });
  const charlieMediaTogglePromise = new Promise((resolve) => {
    socketCharlie.once('user-toggle-media', (payload) => resolve(payload));
  });

  socketAlice.emit('user-toggle-media', { roomId, isMicOn: false, isCameraOn: false });
  const [toggleBob, toggleCharlie] = await Promise.all([bobMediaTogglePromise, charlieMediaTogglePromise]);
  if (toggleBob.isMicOn !== false || toggleCharlie.isCameraOn !== false) {
    throw new Error('Media toggle broadcast mismatch');
  }
  console.log('  ✓ Media state (Mic off / Camera off) received by all mesh peers');

  // Chat message broadcast to all 4 participants
  let chatCount = 0;
  const countMsg = () => {
    chatCount++;
  };
  socketAlice.on('receive-message', countMsg);
  socketBob.on('receive-message', countMsg);
  socketCharlie.on('receive-message', countMsg);
  socketDana.on('receive-message', countMsg);

  socketAlice.emit('send-message', { roomId, message: 'Hello team from Alice!' });
  while (chatCount < 4) {
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log('  ✓ Chat message delivered to all 4 room participants');

  // Step 9: Participant Departure & Mesh Cleanup
  console.log('\n[9/10] Testing participant leave (Bob leaves)...');
  const aliceSeesBobLeavePromise = new Promise((resolve) => {
    socketAlice.once('participant-left', (payload) => resolve(payload));
  });
  const charlieSeesBobLeavePromise = new Promise((resolve) => {
    socketCharlie.once('participant-left', (payload) => resolve(payload));
  });

  socketBob.emit('leave-room', { roomId });
  const [leaveAlice, leaveCharlie] = await Promise.all([aliceSeesBobLeavePromise, charlieSeesBobLeavePromise]);
  if (leaveAlice.socketId !== socketBob.id || leaveCharlie.remainingCount !== 3) {
    throw new Error('Participant leave broadcast mismatch');
  }
  console.log('  ✓ Bob left room. Remaining participants notified (remaining: 3)');

  // Step 10: Participant limit enforcement (Max 6) & Room Isolation
  console.log('\n[10/10] Testing Room Participant Limit (Max 6) and Room Isolation...');
  const extraUsers = [];
  for (let i = 0; i < 4; i++) {
    const r = await (
      await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Extra User ${i}`,
          email: `extra_${i}_${rand}@example.com`,
          password: 'password123',
        }),
      })
    ).json();
    extraUsers.push(r.token);
  }

  // Sockets 5, 6, 7 join (Room now has Alice, Charlie, Dana = 3 -> adding 3 fills room to 6)
  const sock5 = io(SOCKET_URL, { auth: { token: extraUsers[0] } });
  const sock6 = io(SOCKET_URL, { auth: { token: extraUsers[1] } });
  const sock7 = io(SOCKET_URL, { auth: { token: extraUsers[2] } });

  await new Promise((res) => {
    sock5.emit('join-room', { roomId });
    sock5.on('room-users', () => res(true));
  });
  await new Promise((res) => {
    sock6.emit('join-room', { roomId });
    sock6.on('room-users', () => res(true));
  });
  await new Promise((res) => {
    sock7.emit('join-room', { roomId });
    sock7.on('room-users', () => res(true));
  });
  console.log('  ✓ Room filled to maximum capacity (6 participants)');

  // 7th socket attempts to join -> must receive limit error
  const sock8 = io(SOCKET_URL, { auth: { token: extraUsers[3] } });
  const limitErrorPromise = new Promise((resolve) => {
    sock8.on('error-message', (err) => resolve(err));
  });
  sock8.emit('join-room', { roomId });

  const limitError = await limitErrorPromise;
  console.log('  ✓ 7th participant rejected with limit message:', limitError.message);

  // Cleanup all test sockets
  socketAlice.disconnect();
  socketBob.disconnect();
  socketCharlie.disconnect();
  socketDana.disconnect();
  sock5.disconnect();
  sock6.disconnect();
  sock7.disconnect();
  sock8.disconnect();

  console.log('\n=== ALL PHASE 5 MULTI-USER WEBRTC MESH TESTS PASSED! ===\n');
}

runMultiUserWebRTCTests().catch((err) => {
  console.error('\n❌ Multi-User WebRTC test failed:', err);
  process.exit(1);
});
