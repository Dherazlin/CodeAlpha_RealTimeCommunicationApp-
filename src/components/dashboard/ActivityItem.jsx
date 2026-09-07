import React from 'react';
import { PhoneCall, CalendarPlus, FileText, UserCheck } from 'lucide-react';

export default function ActivityItem({ activity }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'meeting_ended':
        return <PhoneCall className="w-3.5 h-3.5 text-slate-500" />;
      case 'meeting_scheduled':
        return <CalendarPlus className="w-3.5 h-3.5 text-brand-600" />;
      case 'file_shared':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case 'meeting_joined':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <PhoneCall className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBg = () => {
    switch (activity.type) {
      case 'meeting_scheduled':
        return 'bg-brand-50 border-brand-100';
      case 'file_shared':
        return 'bg-amber-50 border-amber-100';
      case 'meeting_joined':
        return 'bg-emerald-50 border-emerald-100';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getBg()}`}>
        {getIcon()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-800 leading-snug truncate">
          {activity.title}
        </p>
        <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
          {activity.subtitle}
        </p>
      </div>
      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap pl-2">
        {activity.time}
      </span>
    </div>
  );
}
