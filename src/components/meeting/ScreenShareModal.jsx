import React from 'react';
import { ScreenShare, Monitor, Layers, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function ScreenShareModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Screen Sharing (Preview)"
      description="Screen sharing capabilities are planned for Phase 2 real-time integration."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-2">
        {/* Visual Mock Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Entire Screen & Application Window Sharing
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              In Phase 2, this will interface with WebRTC screen capture APIs to stream 1080p 60fps video directly to participants.
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>This is a mock UI dialog. No browser screen permissions are requested in Phase 1.</span>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
}
