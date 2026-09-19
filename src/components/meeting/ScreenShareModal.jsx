import React from 'react';
import { AlertCircle, MonitorOff } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function ScreenShareModal({
  isOpen,
  onClose,
  title = 'Cannot Share Screen',
  message,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Screen sharing request could not be completed."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-2">
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <MonitorOff className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-900">
              Sharing Notice
            </h4>
            <p className="text-[12px] text-rose-700 mt-1 leading-relaxed">
              {message || 'Only one participant can share their screen at a time. Please wait for the current presenter to stop sharing.'}
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
}
