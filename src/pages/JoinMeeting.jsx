import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, ArrowLeft, LogIn, Clipboard, Sparkles, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { meetingApi } from '../utils/api';

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);

  // Load user's recent rooms from MongoDB
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await meetingApi.getMyMeetings();
        if (res.success && Array.isArray(res.meetings)) {
          setRecentRooms(res.meetings.slice(0, 3));
        }
      } catch (err) {
        console.warn('[JoinMeeting] Error loading recent meetings:', err);
      }
    };

    fetchRecent();
  }, []);

  const handleJoin = async (codeToJoin) => {
    const target = (codeToJoin || roomCode).trim();
    if (!target) {
      setError('Please enter a valid meeting code or link');
      return;
    }

    // Extract ID if full URL pasted
    let cleanedCode = target;
    if (target.includes('/meeting/')) {
      cleanedCode = target.split('/meeting/')[1].split('?')[0];
    }
    cleanedCode = cleanedCode.trim().toUpperCase();

    setError('');
    setLoading(true);

    try {
      // Validate meeting against MongoDB Atlas backend
      const res = await meetingApi.getMeeting(cleanedCode);

      if (!res.success || !res.meeting) {
        setError(`Meeting with Room ID "${cleanedCode}" does not exist.`);
        return;
      }

      if (res.meeting.status === 'ended') {
        setError(`Meeting "${cleanedCode}" has already ended and cannot be rejoined.`);
        return;
      }

      navigate(`/meeting/${cleanedCode}`, {
        state: {
          title: res.meeting.title,
          category: res.meeting.category,
        },
      });
    } catch (err) {
      console.error('[JoinMeeting] Validation error:', err);
      setError(err.message || `Could not find active meeting with Room ID "${cleanedCode}"`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRoomCode(text);
        setError('');
      }
    } catch (err) {
      // Fallback for browsers with restricted clipboard
      const promptText = prompt('Paste meeting code or link:');
      if (promptText) {
        setRoomCode(promptText);
        setError('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Join a Meeting
              </h1>
              <p className="text-xs text-slate-500">
                Enter your meeting ID or paste the invitation link
              </p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Room Code Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
          className="space-y-4"
        >
          <div>
            <Input
              label="Meeting Code or URL"
              id="join-room-code"
              type="text"
              required
              placeholder="e.g. KOR-8492 or https://korus.app/meeting/..."
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value);
                if (error) setError('');
              }}
              error={error}
              endAdornment={
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg transition-colors"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              }
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            icon={ArrowRight}
            iconPosition="right"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Verifying Room...' : 'Join Meeting Room'}
          </Button>
        </form>

        {/* Quick Suggestions from User's Meeting History */}
        {recentRooms.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Your recent rooms:</span>
            </span>

            <div className="space-y-2">
              {recentRooms.map((meeting) => {
                const rId = meeting.roomId || meeting.id;
                const isLive = meeting.status === 'live';
                return (
                  <button
                    key={rId}
                    type="button"
                    onClick={() => handleJoin(rId)}
                    className="w-full p-2.5 rounded-xl border border-slate-200/80 hover:border-brand-300 hover:bg-brand-50/50 flex items-center justify-between text-left transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-700">
                          {meeting.title}
                        </p>
                        {isLive && (
                          <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded-full font-bold">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500">{rId}</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
                      {isLive ? 'Join →' : 'View →'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

