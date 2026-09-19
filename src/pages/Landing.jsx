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
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-between selection:bg-brand-500 selection:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Video className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Korus</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center min-h-screen pt-20 pb-16">
        {/* Top Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200/80 dark:border-brand-500/20 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Modern Team Communication & Meetings</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-5xl leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          One place for meetings, collaboration and communication.
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Experience frictionless video calls with the intuitive navigation of everyday chat apps and the reliable controls of modern conferencing tools.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/dashboard')}
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto shadow-lg shadow-brand-500/20 dark:shadow-brand-500/10 text-base py-3.5 px-8"
          >
            Launch Dashboard
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/meeting/new')}
            icon={Video}
            className="w-full sm:w-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-base py-3.5 px-8"
          >
            Instant Meeting
          </Button>
        </div>

        {/* Visual Meeting Room Interface Mock Preview */}
        <div className="w-full max-w-5xl rounded-3xl bg-slate-900 dark:bg-slate-950 p-2 sm:p-4 shadow-2xl dark:shadow-brand-900/10 border border-slate-800 text-left mb-20 relative group animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500 overflow-hidden">
          {/* Subtle top glow in dark mode */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent opacity-0 dark:opacity-100" />
          
          {/* Mock Window Top Bar */}
          <div className="h-10 px-4 bg-slate-800/90 dark:bg-slate-900/90 rounded-2xl flex items-center justify-between text-xs text-slate-300 mb-4 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-3 font-mono text-xs text-slate-400">Korus Live Room: KOR-8492</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>4 Participants</span>
            </div>
          </div>

          {/* 4 Mock Participant Tiles */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 aspect-video max-h-[480px]">
            <div className="relative rounded-2xl bg-slate-950 border border-brand-500/80 ring-2 ring-brand-500/30 overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80"
                alt="Sarah Chen"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-brand-500 text-white text-[11px] font-bold shadow-sm">
                Speaking
              </div>
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium border border-slate-700/50">
                Sarah Chen (Host)
              </div>
            </div>

            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80"
                alt="Rahul Sharma"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium border border-slate-700/50">
                Rahul Sharma
              </div>
            </div>

            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80"
                alt="Elena Rostova"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium border border-slate-700/50">
                Elena Rostova
              </div>
            </div>

            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                alt="You"
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium border border-slate-700/50">
                You (Alex Morgan)
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="w-full max-w-6xl text-left pb-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Designed for effortless collaboration
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
              Engineered with clean usability inspired by the best communication standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5 border border-brand-100 dark:border-brand-500/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 text-white flex items-center justify-center">
              <Video className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Korus Communication</span>
            <span className="text-slate-400 dark:text-slate-500">• Production Ready</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              Register
            </Link>
            <Link to="/dashboard" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
