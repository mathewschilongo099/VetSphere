'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
  // Error notices are shown but never sent back to the AI as history.
  error?: boolean;
}

const GREETING: Message = {
  role: 'ai',
  text: 'Hello! I am VetAssist, the AI assistant for VetSphere. Ask me anything about animal health, livestock, pets, or any other question and I will do my best to help you.',
};

const STORAGE_KEY = 'vetassist-chat-v1';
const MAX_STORED_MESSAGES = 40;
const MAX_HISTORY_MESSAGES = 12;

export default function AskPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Restore the previous conversation after a refresh.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid: Message[] = parsed
            .filter(
              (m) =>
                m &&
                (m.role === 'user' || m.role === 'ai') &&
                typeof m.text === 'string'
            )
            .map((m) => ({ role: m.role, text: m.text, error: m.error === true }));
          if (valid.length > 0) setMessages([GREETING, ...valid.slice(-MAX_STORED_MESSAGES)]);
        }
      }
    } catch {
      // Storage unavailable or corrupted: start a fresh chat.
    }
    setHydrated(true);
  }, []);

  // Save the conversation (without the greeting) whenever it changes.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const toSave = messages.slice(1).slice(-MAX_STORED_MESSAGES);
      if (toSave.length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore storage errors.
    }
  }, [messages, hydrated]);

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

    // The recent conversation (without the greeting and error notices) plus the
    // new question is sent so VetAssist remembers what was said before.
    const history = [...messages.slice(1).filter((m) => !m.error), { role: 'user' as const, text: userMessage }]
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));
      const answer = typeof data.answer === 'string' && data.answer ? data.answer : '';
      setMessages((prev) => [
        ...prev,
        answer
          ? { role: 'ai', text: answer }
          : {
              role: 'ai',
              text: data.error || 'Sorry, I could not find an answer. Please try again.',
              error: true,
            },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Something went wrong. Please try again.', error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    if (loading) return;
    setMessages([GREETING]);
    setQuery('');
  };

  const suggestedQuestions = [
    'What are symptoms of milk fever?',
    'How do I prevent Newcastle Disease?',
    'My dog is not eating, what should I do?',
    'How to treat foot rot in goats?',
    'What vaccines does my cattle need?',
  ];

  return (
    <div className="neo-page min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            aria-hidden="true"
            className="neo-raised neo-accent mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-lg font-extrabold"
          >
            VA
          </div>
          <h1 className="neo-text mb-3 text-3xl font-extrabold sm:text-4xl">Ask VetAssist</h1>
          <p className="neo-muted mx-auto max-w-xl text-base">
            Get instant answers to your questions, powered by AI and built for farmers and pet owners.
          </p>
        </div>

        {messages.length === 1 && (
          <div className="mb-8">
            <p className="neo-muted mb-4 text-center text-sm">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(q)}
                  className="neo-btn neo-text rounded-full px-4 py-2 text-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat card */}
        <div className="neo-card p-4 sm:p-6">
          {messages.length > 1 && (
            <div className="mb-2 flex justify-end px-3">
              <button
                type="button"
                onClick={newChat}
                disabled={loading}
                className="neo-btn neo-text rounded-full px-4 py-2 text-xs"
              >
                New chat
              </button>
            </div>
          )}
          <div className="max-h-[55vh] space-y-5 overflow-y-auto p-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="neo-raised neo-accent mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    VA
                  </div>
                )}
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'neo-pressed neo-accent font-medium'
                      : 'neo-raised neo-text'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="neo-raised neo-accent mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  VA
                </div>
                <div className="neo-raised rounded-2xl px-4 py-3">
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
              maxLength={500}
              className="neo-field min-w-0 flex-1 rounded-2xl px-5 py-4 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="neo-btn neo-accent rounded-2xl px-6 py-4 font-bold"
            >
              {loading ? '…' : 'Ask'}
            </button>
          </form>
        </div>

        <p className="neo-muted mt-6 text-center text-xs">
          VetAssist is an AI assistant. Always consult a qualified veterinarian for serious animal health concerns.
        </p>
      </div>
    </div>
  );
}
