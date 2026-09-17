import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';

export default function ChatPanel({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (onSendMessage) {
      onSendMessage(inputText.trim());
    }
    setInputText('');
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-96 bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      role="region"
      aria-label="In-meeting Group Chat"
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-slate-100">Meeting Chat</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Close chat panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 dark-scroll">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Send a message to start conversation with participants in this meeting."
            className="bg-transparent border-slate-800 text-slate-400 py-10"
          />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.isSelf ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!msg.isSelf && (
                <Avatar
                  src={msg.avatar}
                  name={msg.sender}
                  initials={msg.initials}
                  size="xs"
                  className="mt-0.5"
                />
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  msg.isSelf
                    ? 'bg-brand-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/70 rounded-tl-xs'
                }`}
              >
                {!msg.isSelf && (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-brand-300 text-[11px]">
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>
                )}
                <p className="break-words">{msg.text}</p>
                {msg.isSelf && (
                  <div className="text-[10px] text-brand-200 text-right mt-1">
                    {msg.time}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to everyone..."
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            aria-label="Chat message"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 text-white rounded-xl transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          Real-time meeting chat powered by Socket.io
        </p>
      </form>
    </div>
  );
}
