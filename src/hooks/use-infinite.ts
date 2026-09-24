"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Fetcher<T> = (cursor: string | null) => Promise<{
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}>;

/**
 * Hook para paginación infinita estilo Pinterest.
 * - `data` acumula todos los items cargados.
 * - Cuando `loadMoreRef` entra en viewport, carga la siguiente página.
 * - `reload` reinicia desde cero con los mismos filtros.
 */
export function useInfinite<T>(fetcher: Fetcher<T>, deps: any[]) {
  const [data, setData] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (cur: string | null, replace: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current(cur);
      setData((prev) => (replace ? res.items : [...prev, ...res.items]));
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (e: any) {
      setError(e?.message || "Error al cargar");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Reset cuando cambian deps
  useEffect(() => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    load(null, true);
  }, deps);

  // Observer para carga infinita
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          load(cursor, false);
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cursor, hasMore, loading, load]);

  const reload = useCallback(() => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    load(null, true);
  }, [load]);

  return { data, loading, error, hasMore, loadMoreRef, reload };
}
