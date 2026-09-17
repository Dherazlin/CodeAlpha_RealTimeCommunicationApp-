import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runParticipantIdentityTest() {
  console.log('=== KORUS PHASE 5: PARTICIPANT IDENTITY TEST SUITE ===\n');

  // Step 1: Health check
  console.log('[1/5] Checking backend server health...');
  const healthRes = await fetch(`${API_URL}/health`);
  const healthData = await healthRes.json();
  if (!healthData.success) throw new Error('Backend health check failed');
  console.log('  ✓ Backend server healthy');

  // Step 2: Register 3 distinct users: Alice, Bob, Charlie
  console.log('\n[2/5] Registering 3 distinct authenticated users (Alice, Bob, Charlie)...');
  const rand = Math.floor(Math.random() * 1000000);
  const userSpecs = [
    { name: 'Alice Walker', email: `alice_${rand}@test.com`, password: 'password123' },
    { name: 'Bob Roberts', email: `bob_${rand}@test.com`, password: 'password123' },
    { name: 'Charlie Davis', email: `charlie_${rand}@test.com`, password: 'password123' },
  ];

  const authData = [];
  for (const spec of userSpecs) {
    const res = await (
      await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spec),
      })
    ).json();
    if (!res.token || !res.user) throw new Error(`Registration failed for ${spec.name}`);
    authData.push({ user: res.user, token: res.token });
    console.log(`  ✓ Registered ${res.user.name} (id: ${res.user.id}, email: ${res.user.email})`);
  }

  const roomId = `KOR-ID${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`\n[3/5] Testing 1-User (Alice joins room ${roomId})...`);

  // Step 3: Alice joins room
  const socketAlice = io(SOCKET_URL, {
    auth: { token: authData[0].token },
    transports: ['websocket', 'polling'],
  });

  const aliceRoomUsersPromise = new Promise((resolve) => {
    socketAlice.on('room-users', (data) => resolve(data));
  });

  await new Promise((resolve) => {
    socketAlice.on('connect', () => {
      console.log(`  [Alice] Socket connected: ${socketAlice.id}`);
      socketAlice.emit('join-room', { roomId });
    });
    aliceRoomUsersPromise.then(() => resolve(true));
  });

  const aliceInitialSnapshot = await aliceRoomUsersPromise;
  console.log('  [Alice] Initial snapshot participants count:', aliceInitialSnapshot.participants.length);
  if (aliceInitialSnapshot.participants.length !== 1) {
    throw new Error('Expected 1 participant for Alice initial room-users snapshot');
  }
  const aliceEntry = aliceInitialSnapshot.participants[0];
  if (aliceEntry.name !== 'Alice Walker' || !aliceEntry.isHost || aliceEntry.role !== 'Host') {
    throw new Error(`Alice identity mismatch: ${JSON.stringify(aliceEntry)}`);
  }
  if (aliceEntry.name.includes('User 1') || aliceEntry.name.includes('Host')) {
    throw new Error('Alice name contains mock hardcoded strings');
  }
  console.log('  ✓ Alice verified as Host with correct authenticated name:', aliceEntry.name);

  // Step 4: 2-User Test (Bob joins the same room)
  console.log('\n[4/5] Testing 2-User Participant Discovery (Bob joins)...');
  const socketBob = io(SOCKET_URL, {
    auth: { token: authData[1].token },
    transports: ['websocket', 'polling'],
  });

  const aliceSeesBobPromise = new Promise((resolve) => {
    socketAlice.once('participant-joined', (data) => resolve(data));
  });

  const bobRoomUsersPromise = new Promise((resolve) => {
    socketBob.on('room-users', (data) => resolve(data));
  });

  await new Promise((resolve) => {
    socketBob.on('connect', () => {
      console.log(`  [Bob] Socket connected: ${socketBob.id}`);
      socketBob.emit('join-room', { roomId });
    });
    bobRoomUsersPromise.then(() => resolve(true));
  });

  const [aliceSeesBob, bobSnapshot] = await Promise.all([
    aliceSeesBobPromise,
    bobRoomUsersPromise,
  ]);

  // Alice sees Bob joined
  console.log('  [Alice] Received participant-joined for:', aliceSeesBob.participant.name);
  if (aliceSeesBob.participant.name !== 'Bob Roberts' || aliceSeesBob.participant.socketId !== socketBob.id) {
    throw new Error(`Alice did not receive accurate Bob participant info: ${JSON.stringify(aliceSeesBob)}`);
  }
  if (aliceSeesBob.participant.isHost) {
    throw new Error('Bob should not be marked as Host');
  }

  // Bob sees Alice and Bob
  console.log('  [Bob] Snapshot received participants:', bobSnapshot.participants.map((p) => `${p.name} (${p.role})`));
  if (bobSnapshot.participants.length !== 2) {
    throw new Error(`Expected 2 participants in Bob snapshot, got ${bobSnapshot.participants.length}`);
  }

  const bobAliceEntry = bobSnapshot.participants.find((p) => p.socketId === socketAlice.id);
  const bobBobEntry = bobSnapshot.participants.find((p) => p.socketId === socketBob.id);

  if (!bobAliceEntry || bobAliceEntry.name !== 'Alice Walker' || !bobAliceEntry.isHost) {
    throw new Error('Bob did not correctly receive Alice as remote Host');
  }
  if (!bobBobEntry || bobBobEntry.name !== 'Bob Roberts' || bobBobEntry.isHost) {
    throw new Error('Bob did not correctly receive Bob as local participant');
  }
  console.log('  ✓ 2-User identity verification PASSED: Both Alice and Bob display exact, non-duplicated authenticated identities!');

  // Step 5: 3-User Test (Charlie joins the room)
  console.log('\n[5/5] Testing 3-User Participant Discovery (Charlie joins)...');
  const socketCharlie = io(SOCKET_URL, {
    auth: { token: authData[2].token },
    transports: ['websocket', 'polling'],
  });

  const aliceSeesCharliePromise = new Promise((resolve) => {
    socketAlice.once('participant-joined', (data) => resolve(data));
  });

  const bobSeesCharliePromise = new Promise((resolve) => {
    socketBob.once('participant-joined', (data) => resolve(data));
  });

  const charlieRoomUsersPromise = new Promise((resolve) => {
    socketCharlie.on('room-users', (data) => resolve(data));
  });

  await new Promise((resolve) => {
    socketCharlie.on('connect', () => {
      console.log(`  [Charlie] Socket connected: ${socketCharlie.id}`);
      socketCharlie.emit('join-room', { roomId });
    });
    charlieRoomUsersPromise.then(() => resolve(true));
  });

  const [aliceSeesCharlie, bobSeesCharlie, charlieSnapshot] = await Promise.all([
    aliceSeesCharliePromise,
    bobSeesCharliePromise,
    charlieRoomUsersPromise,
  ]);

  if (aliceSeesCharlie.participant.name !== 'Charlie Davis' || bobSeesCharlie.participant.name !== 'Charlie Davis') {
    throw new Error('Alice or Bob did not receive correct Charlie joined event');
  }

  console.log('  [Charlie] Snapshot participants:', charlieSnapshot.participants.map((p) => `${p.name} (${p.role})`));
  if (charlieSnapshot.participants.length !== 3) {
    throw new Error(`Expected 3 participants in Charlie snapshot, got ${charlieSnapshot.participants.length}`);
  }

  const namesInCharlie = charlieSnapshot.participants.map((p) => p.name);
  if (!namesInCharlie.includes('Alice Walker') || !namesInCharlie.includes('Bob Roberts') || !namesInCharlie.includes('Charlie Davis')) {
    throw new Error(`Missing expected participants in Charlie room snapshot: ${namesInCharlie.join(', ')}`);
  }

  // Verify unique socketIds and userIds
  const socketIds = new Set(charlieSnapshot.participants.map((p) => p.socketId));
  const userIds = new Set(charlieSnapshot.participants.map((p) => p.userId));
  if (socketIds.size !== 3 || userIds.size !== 3) {
    throw new Error('Duplicate socket IDs or user IDs found in room state');
  }

  console.log('  ✓ 3-User identity verification PASSED: Alice, Bob, and Charlie each appear exactly once with genuine authenticated identities!');

  // Cleanup
  socketAlice.disconnect();
  socketBob.disconnect();
  socketCharlie.disconnect();

  console.log('\n=== ALL PARTICIPANT IDENTITY TESTS PASSED SUCCESSFULLY! ===\n');
}

runParticipantIdentityTest().catch((err) => {
  console.error('\n❌ Participant identity test failed:', err);
  process.exit(1);
});
