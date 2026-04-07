import { useState, useCallback } from 'react';

const KEY = 'vm_recently_viewed';
const MAX = 8;

function readIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(readIds);

  const addViewed = useCallback((id: string) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearViewed = useCallback(() => {
    localStorage.removeItem(KEY);
    setIds([]);
  }, []);

  return { ids, addViewed, clearViewed };
}
