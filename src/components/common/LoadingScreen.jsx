import React from 'react';
import { Video, Loader2 } from 'lucide-react';

export default function LoadingScreen({ message = 'Loading Korus...' }) {
  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 text-center selection:bg-brand-500 selection:text-white">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Video className="w-7 h-7" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Korus</h2>
          <p className="text-xs text-slate-400 mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  );
}
