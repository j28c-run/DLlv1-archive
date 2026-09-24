"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, ImageOff } from "lucide-react";

import { Navbar } from "@/components/gallery/Navbar";
import { Hero } from "@/components/gallery/Hero";
import { FilterBar, type FilterState } from "@/components/gallery/FilterBar";
import { PhotoCard } from "@/components/gallery/PhotoCard";
import { useInfinite } from "@/hooks/use-infinite";
import type { Filters, Photo } from "@/lib/types";

const INITIAL_STATE: FilterState = {
  q: "",
  category: "Todas",
  source: "Todas",
  year: "Todos",
  tag: "",
  sort: "recent",
};

export default function Home() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_STATE);

  // Cargar filtros disponibles
  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then(setFilters)
      .catch(() => {});
  }, []);

  // Construir URL de la API con debounce de búsqueda
  const [debouncedQ, setDebouncedQ] = useState(filterState.q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filterState.q), 350);
    return () => clearTimeout(t);
  }, [filterState.q]);

  const fetcher = useCallback(
    async (cursor: string | null) => {
      const params = new URLSearchParams({
        limit: "30",
        sort: filterState.sort,
        category: filterState.category,
        source: filterState.source,
        year: filterState.year,
      });
      if (debouncedQ) params.set("q", debouncedQ);
      if (filterState.tag) params.set("tag", filterState.tag);
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/photos?${params}`);
      if (!res.ok) throw new Error("Error al cargar fotos");
      return res.json();
    },
    [
      filterState.sort,
      filterState.category,
      filterState.source,
      filterState.year,
      filterState.tag,
      debouncedQ,
    ],
  );

  const { data, loading, error, hasMore, loadMoreRef, reload } =
    useInfinite<Photo>(fetcher, [
      filterState.sort,
      filterState.category,
      filterState.source,
      filterState.year,
      filterState.tag,
      debouncedQ,
    ]);

  const handleClear = useCallback(() => {
    setFilterState(INITIAL_STATE);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />

      <section
        id="galeria"
        className="mx-auto w-full max-w-[1800px] px-3 sm:px-4 lg:px-6 pt-6"
      >
        {/* Sticky filter bar */}
        <div className="sticky top-14 z-30 -mx-3 sm:mx-0 px-3 sm:px-0 py-2">
          <FilterBar
            state={filterState}
            setState={setFilterState}
            filters={filters}
            resultsCount={data.length}
            totalCount={filters?.total || 0}
            onClear={handleClear}
          />
        </div>

        {/* Gallery masonry */}
        <div className="mt-4 pb-10">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ImageOff className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              <button
                type="button"
                onClick={reload}
                className="rounded-lg bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium hover:bg-amber-400"
              >
                Reintentar
              </button>
            </div>
          ) : data.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                <ImageOff className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No se encontraron fotos
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Prueba con otra palabra, categoría o cambia el año.
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium hover:bg-amber-400"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3">
                {data.map((photo, idx) => (
                  <PhotoCard key={photo.id} photo={photo} index={idx} />
                ))}
              </div>

              {/* Sentinel + status */}
              <div
                ref={loadMoreRef}
                className="mt-6 flex items-center justify-center py-4"
              >
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando más fotos…
                  </div>
                )}
                {!loading && !hasMore && data.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Has llegado al final · {data.length} fotos mostradas
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>
              Archivo no oficial · Hecho por fans · {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href="https://www.instagram.com/douhalaribilive/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-200 hover:text-amber-100 underline-offset-2 hover:underline"
            >
              Instagram
            </a>
            <a
              href="https://www.patreon.com/cw/DouhaLaribiLive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-200 hover:text-amber-100 underline-offset-2 hover:underline"
            >
              Patreon
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
