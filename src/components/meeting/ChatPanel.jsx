import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';
import SidePanel from './SidePanel';

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

  const footer = (
    <form onSubmit={handleSend}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
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
    </form>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Meeting Chat"
      icon={MessageSquare}
      footer={footer}
    >
      <div className="flex-1 space-y-3.5">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Send a message to start conversation with participants in this meeting."
            className="bg-transparent border-transparent text-slate-400 dark:text-slate-500 py-10"
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
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  msg.isSelf
                    ? 'bg-brand-600 text-white rounded-tr-xs shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/70 rounded-tl-xs'
                }`}
              >
                {!msg.isSelf && (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-brand-600 dark:text-brand-400 text-[11px]">
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{msg.time}</span>
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
    </SidePanel>
  );
}
