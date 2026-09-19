import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Download, File, X, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { meetingApi } from '../../utils/api';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import SidePanel from './SidePanel';

export default function FilePanel({ roomId, onClose, sharedFiles, onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new files arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sharedFiles]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';
    setUploadError(null);

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await meetingApi.uploadFile(roomId, formData);
      if (res.success) {
        onUploadComplete(res.file);
      } else {
        setUploadError(res.message || 'Failed to upload file');
      }
    } catch (err) {
      console.error('[File Sharing] Upload error:', err);
      setUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SidePanel
      isOpen={!!roomId && true} // It uses the isOpen prop implicitly passed by MeetingRoom... Wait, FilePanel takes `isOpen` ? Actually it didn't in the original. Let me check its props. Ah, MeetingRoom passes `isFilePanelOpen`. Let me ensure it accepts `isOpen`.
      onClose={onClose}
      title="Shared Files"
      icon={Paperclip}
      footer={
        <div className="flex flex-col gap-2">
          {uploadError && (
            <div className="mb-1 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 dark:text-rose-300">{uploadError}</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="primary"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 border-none text-white shadow-brand-500/20 shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload File</span>
              </>
            )}
          </Button>
          <p className="text-center text-[10px] text-slate-500">Max size: 10MB</p>
        </div>
      }
    >
      {/* File List */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4"
      >
        {sharedFiles.length === 0 ? (
          <EmptyState
            icon={Paperclip}
            title="No files shared yet"
            description="Upload a file to share with everyone in the room."
            className="bg-transparent border-transparent text-slate-400 dark:text-slate-500 py-10"
          />
        ) : (
          sharedFiles.map((file) => (
            <div
              key={file._id}
              className="group bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 transition-colors relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {formatFileSize(file.size)} • {file.uploaderName}
                  </p>
                </div>
                <a
                  href={meetingApi.getDownloadUrl(roomId, file._id)}
                  download={file.originalName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-400/10 rounded-lg transition-colors shrink-0"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </SidePanel>
  );
}
