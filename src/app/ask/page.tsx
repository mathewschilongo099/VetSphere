'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

// Explicit colors everywhere so text stays readable in dark mode.
const raised = 'shadow-[6px_6px_12px_#c5cad6,-6px_-6px_12px_#ffffff]';
const pressed = 'shadow-[inset_4px_4px_8px_#c5cad6,inset_-4px_-4px_8px_#ffffff]';

export default function AskPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Hello! I am VetAssist, the AI assistant for VetSphere. Ask me anything about animal health, livestock, pets, or any other question and I will do my best to help you.',
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
          text: data.answer || 'Sorry, I could not find an answer. Please try again.',
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: 'Something went wrong. Please try again.' },
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
    <div className="min-h-screen bg-[#e6e9ef] px-4 py-12 text-[#2b3040]">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            aria-hidden="true"
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6e9ef] text-lg font-extrabold text-green-700 ${raised}`}
          >
            VA
          </div>
          <h1 className="mb-3 text-3xl font-extrabold sm:text-4xl">Ask VetAssist</h1>
          <p className="mx-auto max-w-xl text-base text-[#6b7280]">
            Get instant answers to your questions, powered by AI and built for farmers and pet owners.
          </p>
        </div>

        {messages.length === 1 && (
          <div className="mb-8">
            <p className="mb-4 text-center text-sm text-[#6b7280]">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(q)}
                  className={`rounded-full bg-[#e6e9ef] px-4 py-2 text-sm text-[#2b3040] transition-shadow ${raised} hover:shadow-[8px_8px_16px_#c5cad6,-8px_-8px_16px_#ffffff] active:shadow-[inset_4px_4px_8px_#c5cad6,inset_-4px_-4px_8px_#ffffff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat card */}
        <div className="rounded-[28px] bg-[#e6e9ef] p-4 shadow-[14px_14px_30px_#c5cad6,-14px_-14px_30px_#ffffff] sm:p-6">
          <div className="max-h-[55vh] space-y-5 overflow-y-auto p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div
                    className={`mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6e9ef] text-xs font-bold text-green-700 ${raised}`}
                  >
                    VA
                  </div>
                )}
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl bg-[#e6e9ef] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? `${pressed} font-medium text-green-800`
                      : `${raised} text-[#2b3040]`
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6e9ef] text-xs font-bold text-green-700 ${raised}`}
                >
                  VA
                </div>
                <div className={`rounded-2xl bg-[#e6e9ef] px-4 py-3 ${raised}`}>
                  <div className="flex items-center gap-1" role="status" aria-label="VetAssist is typing">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-green-600" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-green-600" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-green-600" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleAsk} className="mt-6 flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any question..."
              aria-label="Your question"
              className="min-w-0 flex-1 rounded-2xl bg-[#e6e9ef] px-5 py-4 text-sm text-[#2b3040] caret-[#2b3040] outline-none [color-scheme:light] placeholder:text-[#8a91a3] shadow-[inset_5px_5px_10px_#c5cad6,inset_-5px_-5px_10px_#ffffff] focus-visible:ring-2 focus-visible:ring-green-600"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`rounded-2xl bg-[#e6e9ef] px-6 py-4 font-bold text-green-700 transition-shadow ${raised} hover:shadow-[8px_8px_16px_#c5cad6,-8px_-8px_16px_#ffffff] active:shadow-[inset_4px_4px_8px_#c5cad6,inset_-4px_-4px_8px_#ffffff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? '…' : 'Ask'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#6b7280]">
          VetAssist is an AI assistant. Always consult a qualified veterinarian for serious animal health concerns.
        </p>
      </div>
    </div>
  );
}
