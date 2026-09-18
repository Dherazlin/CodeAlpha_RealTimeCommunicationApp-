import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, ArrowLeft, Calendar, Lock, Globe, Sparkles, Plus, Clock, AlertCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { meetingCategories } from '../data/mockData';
import { meetingApi } from '../utils/api';

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'org'
  const [dateOption, setDateOption] = useState('now'); // 'now' | 'scheduled'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await meetingApi.createMeeting({
        title: title.trim() || 'New Meeting',
        description: description.trim(),
        category,
        privacy,
      });

      if (response.success && response.meeting) {
        navigate(`/meeting/${response.meeting.roomId}`, {
          state: {
            title: response.meeting.title,
            category: response.meeting.category,
          },
        });
      } else {
        setError(response.message || 'Failed to create meeting');
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError(err.message || 'Network error while creating meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Create New Meeting
              </h1>
              <p className="text-xs text-slate-500">
                Configure your meeting room and generate an access code
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

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Meeting Title (Optional)"
            id="meeting-title"
            type="text"
            placeholder="e.g. Weekly Product Sync"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label htmlFor="meeting-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="meeting-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this meeting cover?"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-slate-400 transition-colors resize-none"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {meetingCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    category === cat.id
                      ? 'bg-brand-50 border-brand-500 text-brand-700 font-semibold ring-1 ring-brand-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timing & Privacy placeholders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <span className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Meeting Schedule</span>
              </span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDateOption('now')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
                    dateOption === 'now'
                      ? 'bg-white shadow-xs text-brand-700 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Start Now
                </button>
                <button
                  type="button"
                  onClick={() => setDateOption('scheduled')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
                    dateOption === 'scheduled'
                      ? 'bg-white shadow-xs text-brand-700 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Schedule
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <span className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Privacy & Access</span>
              </span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPrivacy('public')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
                    privacy === 'public'
                      ? 'bg-white shadow-xs text-brand-700 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Anyone with Link
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacy('org')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
                    privacy === 'org'
                      ? 'bg-white shadow-xs text-brand-700 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Organization Only
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Plus}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Meeting'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
