'use client';

import { useCallback, useState } from 'react';
import { api, errMsg, type AdminArticle } from './api';

// Loads every article with its front matter once, and shares it between tabs.
export function useArticles() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await api<{ articles?: AdminArticle[]; error?: string }>(
        `/api/articles/meta${fresh ? '?fresh=1' : ''}`
      );
      if (data.error) throw new Error(data.error);
      setArticles(data.articles || []);
    } catch (e) {
      setError(errMsg(e, 'Failed to load articles.'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { articles, loading, error, load };
}
