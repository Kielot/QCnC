import { useEffect, useState } from 'react';
/** Fetches once, then repeats every `ms` (null = once) until `until(data)` returns true. */
export function usePoll<T>(fn: () => Promise<T>, ms: number | null, deps: unknown[] = [], until?: (d: T) => boolean) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true; let t: ReturnType<typeof setTimeout>;
    const tick = async () => {
      let stop = false;
      try { const d = await fn(); if (alive) { setData(d); setError(null); } if (until?.(d)) stop = true; }
      catch (e) { if (alive) setError((e as Error).message); }
      finally { if (alive) { setLoading(false); if (ms && !stop) t = setTimeout(tick, ms); } }
    };
    tick();
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading };
}
export function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => { const u = () => setOn(navigator.onLine); window.addEventListener('online', u); window.addEventListener('offline', u); return () => { window.removeEventListener('online', u); window.removeEventListener('offline', u); }; }, []);
  return on;
}
