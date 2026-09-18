import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  LogIn,
  Calendar,
  Clock,
  Search,
  Sparkles,
  ArrowRight,
  Activity,
  FolderOpen,
  Settings,
  HelpCircle,
  Radio,
  RefreshCw,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import QuickAction from '../components/dashboard/QuickAction';
import MeetingCard from '../components/dashboard/MeetingCard';
import ActivityItem from '../components/dashboard/ActivityItem';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { meetingApi } from '../utils/api';
import { recentActivities } from '../data/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'meetings' | 'recent' | 'files' | 'settings' | 'help'
  const [meetingView, setMeetingView] = useState('upcoming'); // 'upcoming' | 'recent'
  const [searchQuery, setSearchQuery] = useState('');

  // Meeting states from MongoDB
  const [liveMeetings, setLiveMeetings] = useState([]);
  const [myMeetings, setMyMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  // Fetch meetings from API
  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingMeetings(true);
      const [liveRes, myRes] = await Promise.all([
        meetingApi.getLiveMeetings().catch(() => ({ success: false, meetings: [] })),
        meetingApi.getMyMeetings().catch(() => ({ success: false, meetings: [] })),
      ]);

      if (liveRes.success && Array.isArray(liveRes.meetings)) {
        setLiveMeetings(liveRes.meetings);
      }
      if (myRes.success && Array.isArray(myRes.meetings)) {
        setMyMeetings(myRes.meetings);
      }
    } catch (err) {
      console.error('[Dashboard] Error loading meetings:', err);
    } finally {
      setLoadingMeetings(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    // Poll live meetings periodically (every 10 seconds)
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // If sidebar navigates to 'recent', automatically select recent history view
  useEffect(() => {
    if (activeTab === 'recent') {
      setMeetingView('recent');
    } else if (activeTab === 'meetings') {
      setMeetingView('upcoming');
    }
  }, [activeTab]);

  // Determine dynamic greeting & user display name
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  // Filter live meetings
  const filteredLive = liveMeetings.filter((m) => {
    const q = searchQuery.toLowerCase();
    const roomId = (m.roomId || m.id || '').toLowerCase();
    const title = (m.title || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    const host = (m.host?.name || '').toLowerCase();
    return title.includes(q) || roomId.includes(q) || desc.includes(q) || host.includes(q);
  });

  // Filter user's upcoming/active meetings
  const myActiveMeetings = myMeetings.filter((m) => m.status === 'live');
  const myPastMeetings = myMeetings.filter((m) => m.status === 'ended');

  const filteredUpcoming = myActiveMeetings.filter((m) => {
    const q = searchQuery.toLowerCase();
    const roomId = (m.roomId || m.id || '').toLowerCase();
    const title = (m.title || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    return title.includes(q) || roomId.includes(q) || desc.includes(q);
  });

  const filteredRecent = myPastMeetings.filter((m) => {
    const q = searchQuery.toLowerCase();
    const roomId = (m.roomId || m.id || '').toLowerCase();
    const title = (m.title || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    return title.includes(q) || roomId.includes(q) || desc.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* WhatsApp-style persistent sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
          {/* Greeting & Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Collaborate with your team, launch instant rooms, or manage upcoming calls.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/meeting/join')}
                icon={LogIn}
              >
                Join with Code
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/meeting/new')}
                icon={Plus}
              >
                New Meeting
              </Button>
            </div>
          </div>

          {/* Quick Action Cards */}
          <section aria-label="Quick Actions" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickAction
              title="Create Instant Meeting"
              subtitle="Generate a room ID and invite teammates instantly"
              icon={Video}
              variant="primary"
              onClick={() => navigate('/meeting/new')}
            />
            <QuickAction
              title="Join with Room Code"
              subtitle="Enter an existing meeting ID or paste invitation link"
              icon={LogIn}
              variant="secondary"
              onClick={() => navigate('/meeting/join')}
            />
          </section>

          {/* Prominent Live Meetings Section */}
          <section aria-label="Live Meetings" className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Live Meetings</span>
                  <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                    {filteredLive.length} active
                  </span>
                </h2>
              </div>
              <button
                type="button"
                onClick={loadDashboardData}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                title="Refresh meetings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMeetings ? 'animate-spin text-brand-600' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {filteredLive.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-center shadow-subtle">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Radio className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No active live meetings right now</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "New Meeting" above to launch an instant persistent room.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLive.map((meeting) => (
                  <MeetingCard key={meeting.roomId || meeting._id || meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </section>

          {/* Active Tab Views */}
          {activeTab === 'files' ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8">
              <EmptyState
                icon={FolderOpen}
                title="Shared Files & Meeting Notes"
                description="Project assets, recorded transcripts, and whiteboard exports will appear here in future phases."
              />
            </div>
          ) : activeTab === 'settings' ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8">
              <EmptyState
                icon={Settings}
                title="Account & Video Preferences"
                description="Custom audio device selection, background blur, and theme preferences will be configurable here."
              />
            </div>
          ) : activeTab === 'help' ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8">
              <EmptyState
                icon={HelpCircle}
                title="Documentation & Keyboard Shortcuts"
                description="Learn hotkeys, troubleshoot network connectivity, and explore our user guide."
              />
            </div>
          ) : (
            /* Main Dashboard Grid: Meetings + Recent Activity */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
              {/* Left 2 Cols: Meetings Section */}
              <div className="lg:col-span-2 space-y-4">
                {/* Tab Switcher & Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMeetingView('upcoming')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                        meetingView === 'upcoming'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      aria-pressed={meetingView === 'upcoming'}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>My Active Meetings</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        meetingView === 'upcoming' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {filteredUpcoming.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMeetingView('recent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                        meetingView === 'recent'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      aria-pressed={meetingView === 'recent'}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Meeting History</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        meetingView === 'recent' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {filteredRecent.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Meetings List */}
                {meetingView === 'upcoming' ? (
                  filteredUpcoming.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title={searchQuery ? 'No matching meetings' : 'No active meetings scheduled'}
                      description={
                        searchQuery
                          ? `No meetings matching "${searchQuery}". Try a different search term.`
                          : 'You have no active calls right now. Create a new meeting or join a live room.'
                      }
                      actionLabel={searchQuery ? 'Clear Search' : 'Start a Meeting'}
                      actionIcon={searchQuery ? undefined : Plus}
                      onAction={() => (searchQuery ? setSearchQuery('') : navigate('/meeting/new'))}
                      className="bg-white"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredUpcoming.map((meeting) => (
                        <MeetingCard key={meeting.roomId || meeting._id || meeting.id} meeting={meeting} />
                      ))}
                    </div>
                  )
                ) : (
                  filteredRecent.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title={searchQuery ? 'No matching history' : 'No past meetings found'}
                      description={
                        searchQuery
                          ? `No past calls matching "${searchQuery}".`
                          : 'Meetings you create or participate in will be logged here permanently.'
                      }
                      actionLabel={searchQuery ? 'Clear Search' : 'Start a Meeting'}
                      actionIcon={searchQuery ? undefined : Video}
                      onAction={() => (searchQuery ? setSearchQuery('') : navigate('/meeting/new'))}
                      className="bg-white"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredRecent.map((meeting) => (
                        <MeetingCard key={meeting.roomId || meeting._id || meeting.id} meeting={meeting} isRecent />
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Right 1 Col: Recent Activity Stream */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Recent Activity
                    </h2>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-4">
                  {recentActivities.length === 0 ? (
                    <EmptyState
                      icon={Activity}
                      title="No activity yet"
                      description="Recent call events and shared files will show up here."
                      className="border-0 bg-transparent py-4"
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recentActivities.map((act) => (
                        <ActivityItem key={act.id} activity={act} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
