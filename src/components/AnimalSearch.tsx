'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface AnimalSearchProps {
  /** Compact mode: no top margin, tighter sizing, colours made for a green background. */
  compact?: boolean;
}

export default function AnimalSearch({ compact = false }: AnimalSearchProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(userMessage)}`,
      );

      const data = await res.json();
      const answer = data.answer || data.response || 'Sorry, I could not find an answer. Please try again.';

      setMessages(prev => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${compact ? '' : 'mt-8'}`}>

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="mb-3 space-y-3 max-h-96 overflow-y-auto px-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? `${compact ? 'bg-white text-green-800' : 'bg-green-500 text-white'} rounded-br-sm`
                    : 'bg-white/15 text-gray-100 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/15 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${compact ? 'bg-white' : 'bg-green-400'}`} style={{ animationDelay: '0ms' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${compact ? 'bg-white' : 'bg-green-400'}`} style={{ animationDelay: '150ms' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${compact ? 'bg-white' : 'bg-green-400'}`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask any animal health question..."
          aria-label="Ask an animal health question"
          className="min-w-0 flex-1 px-4 py-3 sm:px-5 sm:py-4 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 bg-white/95 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`shrink-0 disabled:opacity-60 disabled:cursor-not-allowed font-bold px-5 py-3 sm:px-6 sm:py-4 rounded-xl transition ${
            compact
              ? 'bg-white hover:bg-green-50 text-green-700'
              : 'bg-green-500 hover:bg-green-400 text-white'
          }`}
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>

      <p className={`text-[11px] sm:text-xs text-center ${compact ? 'text-green-100 mt-2' : 'text-gray-400 mt-3'}`}>
        AI answers are general information and can be wrong. They are not a diagnosis; for a sick animal, contact a veterinarian.
      </p>
    </div>
  );
}
