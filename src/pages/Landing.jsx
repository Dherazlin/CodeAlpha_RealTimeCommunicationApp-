import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
  ScreenShare,
  FileText,
  PenTool,
  Shield,
  ArrowRight,
  CheckCircle2,
  Users,
  Mic,
  Sparkles,
} from 'lucide-react';
import Button from '../components/common/Button';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: 'Crystal Clear Video',
      description: 'Adaptive layout optimized for 1-on-1 calls and large team discussions with zero clutter.',
    },
    {
      icon: ScreenShare,
      title: 'Instant Screen Sharing',
      description: 'Share presentations, application windows, or browser tabs smoothly with your teammates.',
    },
    {
      icon: PenTool,
      title: 'Collaborative Whiteboard',
      description: 'Brainstorm ideas, sketch architecture, and map workflows together in real time.',
    },
    {
      icon: FileText,
      title: 'Secure File Sharing',
      description: 'Exchange project files, meeting notes, and attachments directly within your sessions.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Video className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Korus</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col items-center text-center">
        {/* Top Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Modern Team Communication & Meetings</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
          One place for meetings, collaboration and communication.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mt-4 mb-8 leading-relaxed">
          Experience frictionless video calls with the intuitive navigation of everyday chat apps and the reliable controls of modern conferencing tools.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-14 w-full sm:w-auto">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/dashboard')}
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto shadow-md"
          >
            Launch Dashboard Demo
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/meeting/new')}
            icon={Video}
            className="w-full sm:w-auto"
          >
            Instant Meeting
          </Button>
        </div>

        {/* Visual Meeting Room Interface Mock Preview */}
        <div className="w-full max-w-4xl rounded-2xl bg-slate-900 p-2 sm:p-4 shadow-2xl border border-slate-800 text-left mb-16 relative group">
          {/* Mock Window Top Bar */}
          <div className="h-9 px-3 bg-slate-800/90 rounded-xl flex items-center justify-between text-xs text-slate-300 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 font-mono text-[11px] text-slate-400">Korus Live Room: KOR-8492</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>4 Participants</span>
            </div>
          </div>

          {/* 4 Mock Participant Tiles */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 aspect-video max-h-[360px]">
            <div className="relative rounded-xl bg-slate-950 border border-emerald-500/80 ring-2 ring-emerald-500/30 overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80"
                alt="Sarah Chen"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold">
                Speaking
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[11px] font-medium">
                Sarah Chen (Host)
              </div>
            </div>

            <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"
                alt="Rahul Sharma"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[11px] font-medium">
                Rahul Sharma
              </div>
            </div>

            <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80"
                alt="Elena Rostova"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[11px] font-medium">
                Elena Rostova
              </div>
            </div>

            <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                alt="You"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[11px] font-medium">
                You (Alex Morgan)
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="w-full text-left">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Designed for effortless collaboration
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Engineered with clean usability inspired by the best communication standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-subtle hover:border-slate-300 hover:shadow-card transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3.5 border border-brand-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{feat.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 text-white flex items-center justify-center">
              <Video className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">Korus Communication</span>
            <span className="text-slate-400">• Phase 1 UI Foundation</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-800 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-800 transition-colors">
              Register
            </Link>
            <Link to="/dashboard" className="hover:text-slate-800 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
