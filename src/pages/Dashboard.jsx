import React, { useState } from 'react';
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
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import QuickAction from '../components/dashboard/QuickAction';
import MeetingCard from '../components/dashboard/MeetingCard';
import ActivityItem from '../components/dashboard/ActivityItem';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import {
  currentUser,
  upcomingMeetings as initialUpcoming,
  recentMeetings as initialRecent,
  recentActivities,
} from '../data/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'meetings' | 'recent' | 'files' | 'settings' | 'help'
  const [meetingView, setMeetingView] = useState('upcoming'); // 'upcoming' | 'recent'
  const [searchQuery, setSearchQuery] = useState('');

  // Determine dynamic greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Filter meetings based on search
  const filteredUpcoming = initialUpcoming.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRecent = initialRecent.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                {greeting}, {currentUser.name.split(' ')[0]} 👋
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
                      <span>Upcoming Meetings</span>
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
                      <span>Recent History</span>
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
                      title={searchQuery ? 'No matching meetings' : 'No upcoming meetings scheduled'}
                      description={
                        searchQuery
                          ? `No meetings matching "${searchQuery}". Try a different search term.`
                          : 'You are all caught up! Create a new meeting to collaborate with your team.'
                      }
                      actionLabel={searchQuery ? 'Clear Search' : 'Schedule Meeting'}
                      actionIcon={searchQuery ? undefined : Plus}
                      onAction={() => (searchQuery ? setSearchQuery('') : navigate('/meeting/new'))}
                      className="bg-white"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredUpcoming.map((meeting) => (
                        <MeetingCard key={meeting.id} meeting={meeting} />
                      ))}
                    </div>
                  )
                ) : (
                  filteredRecent.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title={searchQuery ? 'No matching history' : 'No recent meetings found'}
                      description={
                        searchQuery
                          ? `No recent calls matching "${searchQuery}".`
                          : 'Your past video sessions will be logged here for easy reference.'
                      }
                      actionLabel={searchQuery ? 'Clear Search' : 'Start a Meeting'}
                      actionIcon={searchQuery ? undefined : Video}
                      onAction={() => (searchQuery ? setSearchQuery('') : navigate('/meeting/new'))}
                      className="bg-white"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredRecent.map((meeting) => (
                        <MeetingCard key={meeting.id} meeting={meeting} isRecent />
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
