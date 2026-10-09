import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

// Loads data every time the screen comes into view, and supports pull-to-refresh.
//   const q = useLoad(async () => ok(await supabase.from('x').select('*')), []);
//   q.data  q.loading  q.error  q.reload()  q.refresh()
export function useLoad<T>(fetcher: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef(fetcher);
  latest.current = fetcher;

  const reload = useCallback(async () => {
    try { setData(await latest.current()); setError(''); }
    catch (e: any) { setError(e.message || 'Something went wrong. Pull down to try again.'); }
    finally { setLoading(false); }
  }, []);

  const refresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  return { data, loading, error, refreshing, reload, refresh };
}
