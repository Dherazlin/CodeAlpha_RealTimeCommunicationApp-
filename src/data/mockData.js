/**
 * Local mock data for Phase 1 Frontend Foundation
 * Cleanly separated to enable seamless integration with real APIs in future phases.
 */

export const currentUser = {
  id: 'usr_me_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@company.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  initials: 'AM',
  role: 'Product Lead',
  status: 'online', // 'online' | 'busy' | 'away'
};

export const meetingCategories = [
  { id: 'standup', label: 'Team Standup', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'design', label: 'Design Review', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'sprint', label: 'Sprint Planning', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: '1on1', label: '1-on-1 Catchup', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'general', label: 'General Meeting', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export const upcomingMeetings = [
  {
    id: 'KOR-8492',
    title: 'Product Design Weekly Sync',
    description: 'Review new component library prototypes and mobile navigation wireframes.',
    category: 'Design Review',
    date: 'Today',
    time: '2:30 PM - 3:15 PM',
    duration: '45 mins',
    isLive: true,
    participants: [
      { name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', initials: 'SC' },
      { name: 'Rahul Sharma', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', initials: 'RS' },
      { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', initials: 'ER' },
      { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', initials: 'DK' },
    ],
    host: 'Sarah Chen',
  },
  {
    id: 'KOR-3914',
    title: 'Sprint 24 Retrospective & Planning',
    description: 'Sprint debrief, velocity check, and backlog item sizing for next release.',
    category: 'Sprint Planning',
    date: 'Today',
    time: '4:00 PM - 5:00 PM',
    duration: '60 mins',
    isLive: false,
    participants: [
      { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', initials: 'MV' },
      { name: 'Lisa Park', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', initials: 'LP' },
      { name: 'Alex Morgan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', initials: 'AM' },
    ],
    host: 'Marcus Vance',
  },
  {
    id: 'KOR-7120',
    title: 'Frontend Architecture 1-on-1',
    description: 'Discussion on state management, responsive video grid, and WebRTC integration roadmap.',
    category: '1-on-1 Catchup',
    date: 'Tomorrow',
    time: '10:00 AM - 10:30 AM',
    duration: '30 mins',
    isLive: false,
    participants: [
      { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', initials: 'DK' },
      { name: 'Alex Morgan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', initials: 'AM' },
    ],
    host: 'David Kim',
  },
];

export const recentMeetings = [
  {
    id: 'KOR-5182',
    title: 'Client Demo & Feedback Session',
    date: 'Yesterday at 3:00 PM',
    duration: '38 mins',
    participantsCount: 5,
    category: 'General Meeting',
    participants: [
      { name: 'Sarah Chen', initials: 'SC' },
      { name: 'Elena Rostova', initials: 'ER' },
      { name: 'Michael Scott', initials: 'MS' },
    ],
  },
  {
    id: 'KOR-1049',
    title: 'Engineering Daily Standup',
    date: 'Sep 6, 2026 at 9:30 AM',
    duration: '18 mins',
    participantsCount: 8,
    category: 'Team Standup',
    participants: [
      { name: 'Rahul Sharma', initials: 'RS' },
      { name: 'Marcus Vance', initials: 'MV' },
      { name: 'Lisa Park', initials: 'LP' },
    ],
  },
  {
    id: 'KOR-9204',
    title: 'Q3 Product Roadmap Review',
    date: 'Sep 5, 2026 at 11:00 AM',
    duration: '52 mins',
    participantsCount: 12,
    category: 'General Meeting',
    participants: [
      { name: 'David Kim', initials: 'DK' },
      { name: 'Sarah Chen', initials: 'SC' },
    ],
  },
];

export const recentActivities = [
  {
    id: 'act_1',
    type: 'meeting_ended',
    title: 'Product Design Weekly Sync ended',
    subtitle: 'Call duration: 42m • 4 participants',
    time: '25m ago',
  },
  {
    id: 'act_2',
    type: 'meeting_scheduled',
    title: 'David Kim scheduled "Frontend Architecture 1-on-1"',
    subtitle: 'Tomorrow at 10:00 AM',
    time: '2h ago',
  },
  {
    id: 'act_3',
    type: 'file_shared',
    title: 'Sarah Chen shared "Sprint24_Wireframes.fig"',
    subtitle: 'Attached in Product Design Sync notes',
    time: '4h ago',
  },
  {
    id: 'act_4',
    type: 'meeting_joined',
    title: 'Marcus Vance joined room KOR-1049',
    subtitle: 'Daily Standup',
    time: 'Yesterday',
  },
];

export const mockParticipantsInRoom = [
  {
    id: 'usr_me',
    name: 'You (Alex Morgan)',
    initials: 'AM',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    isHost: false,
    isSelf: true,
    isMicOn: true,
    isCameraOn: true,
    isSpeaking: false,
    role: 'You',
  },
  {
    id: 'usr_sarah',
    name: 'Sarah Chen',
    initials: 'SC',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    isHost: true,
    isSelf: false,
    isMicOn: true,
    isCameraOn: true,
    isSpeaking: true,
    role: 'Host',
  },
  {
    id: 'usr_rahul',
    name: 'Rahul Sharma',
    initials: 'RS',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    isHost: false,
    isSelf: false,
    isMicOn: false,
    isCameraOn: true,
    isSpeaking: false,
    role: 'Participant',
  },
  {
    id: 'usr_elena',
    name: 'Elena Rostova',
    initials: 'ER',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    isHost: false,
    isSelf: false,
    isMicOn: true,
    isCameraOn: false, // camera off state demo
    isSpeaking: false,
    role: 'Participant',
  },
];

export const mockChatMessages = [
  {
    id: 'msg_1',
    sender: 'Sarah Chen',
    initials: 'SC',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    text: 'Welcome everyone! Let us review the new interface layout.',
    time: '2:31 PM',
    isSelf: false,
  },
  {
    id: 'msg_2',
    sender: 'Rahul Sharma',
    initials: 'RS',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    text: 'Looks super clean. Are the meeting controls responsive on mobile too?',
    time: '2:32 PM',
    isSelf: false,
  },
  {
    id: 'msg_3',
    sender: 'Elena Rostova',
    initials: 'ER',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    text: 'Yes, tested on tablet and phone viewports. Everything collapses smoothly into drawers!',
    time: '2:33 PM',
    isSelf: false,
  },
  {
    id: 'msg_4',
    sender: 'You',
    initials: 'AM',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Great work team. Let us go through the participant panel interactions.',
    time: '2:34 PM',
    isSelf: true,
  },
];

/**
 * Generate a randomized mock room code in format KOR-XXXX
 */
export const generateRoomId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KOR-${code}`;
};
