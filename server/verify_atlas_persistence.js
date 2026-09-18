import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Meeting from './models/Meeting.js';

dotenv.config();

async function verifyPersistence() {
  console.log('Connecting to MongoDB Atlas directly...');
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`Connected to Atlas host: ${conn.connection.host}`);
  console.log(`Database name in use: ${conn.connection.db.databaseName}`);

  const userCount = await User.countDocuments();
  const meetingCount = await Meeting.countDocuments();
  console.log(`\nAtlas Document Counts:`);
  console.log(`  Users: ${userCount}`);
  console.log(`  Meetings: ${meetingCount}`);

  if (userCount === 0 || meetingCount === 0) {
    throw new Error('No users or meetings found in MongoDB Atlas!');
  }

  // Find the latest meeting
  const latestMeeting = await Meeting.findOne().sort({ createdAt: -1 }).populate('host').populate('participants.user');
  console.log('\nLatest Meeting Document from Atlas:');
  console.log('  Room ID:', latestMeeting.roomId);
  console.log('  Title:', latestMeeting.title);
  console.log('  Status:', latestMeeting.status);
  console.log('  Host Object:', latestMeeting.host ? `${latestMeeting.host.name} (${latestMeeting.host._id})` : 'None');
  console.log('  Started At:', latestMeeting.startedAt);
  console.log('  Ended At:', latestMeeting.endedAt);
  console.log('  Participants count:', latestMeeting.participants.length);
  latestMeeting.participants.forEach((p, idx) => {
    console.log(`    [${idx + 1}] User: ${p.user?.name || p.user} | Joined: ${p.joinedAt} | Left: ${p.leftAt}`);
  });

  if (!latestMeeting.host || !latestMeeting.host._id) {
    throw new Error('Meeting host is not a populated User document!');
  }

  console.log('\n✓ Direct Atlas persistence verified successfully!');
  await mongoose.disconnect();
}

verifyPersistence().catch((err) => {
  console.error('Atlas persistence verification failed:', err);
  process.exit(1);
});
