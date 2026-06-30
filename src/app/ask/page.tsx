'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function AskPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Hello! I am VetAssist, the AI assistant for VetSphere. Ask me anything about your livestock, pets, or animal health and I will do my best to help you.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [messages, loading]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setQuery('');

    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(userMessage)}`
      );

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text:
            data.answer ||
            'Sorry, I could not find an answer. Please try again.',
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'What are symptoms of milk fever?',
    'How do I prevent Newcastle Disease?',
    'My dog is not eating, what should I do?',
    'How to treat foot rot in goats?',
    'What vaccines does my cattle need?',
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gray-900 text-white py-12 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
          Ask <span className="text-green-400">VetAssist</span>
        </h1>
        <p className="text-gray-300 text-base max-w-xl mx-auto">
          Get instant answers to your animal health questions — powered by AI, built for farmers and pet owners.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {messages.length === 1 && (
          <div className="mb-6">
            <p className="text-gray-500 text-sm mb-3 text-center">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(q)}
                  className="bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full hover:bg-green-50 hover:border-green-300 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto px-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0 mt-1">
                  VA
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">
                VA
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleAsk} className="flex gap-3 sticky bottom-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask any animal health question..."
            className="flex-1 px-5 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-xl transition"
          >
            {loading ? '...' : 'Ask'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-4">
          VetAssist is an AI assistant. Always consult a qualified veterinarian for serious animal health concerns.
        </p>
      </div>
    </div>
  );
}
