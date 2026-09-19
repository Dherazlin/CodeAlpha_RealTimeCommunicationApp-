import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Download, File, X, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { meetingApi } from '../../utils/api';
import Button from '../common/Button';

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
    <div className="w-80 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col h-full shadow-2xl shrink-0 transition-transform duration-300">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-emerald-400" />
          Shared Files
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          aria-label="Close file panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* File List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50"
      >
        {sharedFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 opacity-60">
            <Paperclip className="w-10 h-10 mb-2" />
            <p className="text-sm font-medium">No files shared yet</p>
            <p className="text-xs">Upload a file to share with everyone in the room.</p>
          </div>
        ) : (
          sharedFiles.map((file) => (
            <div
              key={file._id}
              className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-3 transition-colors relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatFileSize(file.size)} • {file.uploaderName}
                  </p>
                </div>
                <a
                  href={meetingApi.getDownloadUrl(roomId, file._id)}
                  download={file.originalName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors shrink-0"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Area */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 shrink-0">
        {uploadError && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{uploadError}</p>
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
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 border-none text-white shadow-emerald-500/20 shadow-lg"
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
        <p className="text-center text-[10px] text-slate-500 mt-2">Max size: 10MB</p>
      </div>
    </div>
  );
}
