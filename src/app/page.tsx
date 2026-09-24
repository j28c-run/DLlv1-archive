"use client";

import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageOff, Heart } from "lucide-react";

import { Hero } from "@/components/gallery/Hero";
import { FilterBar } from "@/components/gallery/FilterBar";
import { GalleryCard } from "@/components/gallery/GalleryCard";
import { Lightbox } from "@/components/gallery/Lightbox";
import {
  GALLERY_ITEMS,
  GALLERY_CATEGORIES,
  GALLERY_STATS,
  type GalleryItem,
  type GalleryCategory,
} from "@/lib/gallery-data";

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    GalleryCategory | "Todas"
  >("Todas");
  const [activeYear, setActiveYear] = useState<string | "Todos">("Todos");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const years = useMemo(() => {
    const set = new Set(
      GALLERY_ITEMS.map((i) => i.date.slice(0, 4)),
    );
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = GALLERY_ITEMS.filter((it) => {
      const matchesQ =
        !q ||
        it.caption.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q));
      const matchesC =
        activeCategory === "Todas" || it.category === activeCategory;
      const matchesY =
        activeYear === "Todos" || it.date.slice(0, 4) === activeYear;
      return matchesQ && matchesC && matchesY;
    });

    list = [...list].sort((a, b) => {
      const da = +new Date(a.date);
      const db = +new Date(b.date);
      return sort === "recent" ? db - da : da - db;
    });

    return list;
  }, [query, activeCategory, activeYear, sort]);

  const handleClear = useCallback(() => {
    setQuery("");
    setActiveCategory("Todas");
    setActiveYear("Todos");
    setSort("recent");
  }, []);

  const openItem = useCallback((it: GalleryItem) => {
    setLightboxItem(it);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxItem(null);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <Hero
        totalPhotos={GALLERY_STATS.totalPhotos}
        categories={GALLERY_STATS.categories}
        years={GALLERY_STATS.years}
        events={GALLERY_STATS.events}
      />

      {/* Filter section */}
      <section
        id="galeria"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 -mt-2"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="sticky top-3 z-30"
        >
          <FilterBar
            query={query}
            setQuery={setQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            activeYear={activeYear}
            setActiveYear={setActiveYear}
            sort={sort}
            setSort={setSort}
            categories={GALLERY_CATEGORIES}
            years={years}
            resultsCount={filtered.length}
            totalCount={GALLERY_ITEMS.length}
            onClear={handleClear}
          />
        </motion.div>

        {/* Gallery */}
        {filtered.length === 0 ? (
          <EmptyState onClear={handleClear} />
        ) : (
          <div className="masonry mt-6 pb-10">
            {filtered.map((item, idx) => (
              <GalleryCard
                key={item.id}
                item={item}
                index={idx}
                onOpen={openItem}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Heart className="h-4 w-4 text-pink-500" />
            <span>
              Hecho con cariño por los fans de{" "}
              <a
                href="https://www.instagram.com/douhalaribilive/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-200 hover:text-amber-100 underline-offset-2 hover:underline"
              >
                @douhalaribilive
              </a>
            </span>
          </div>
          <div className="text-xs text-muted-foreground/70">
            Página no oficial · Sin ánimo de lucro · {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      <Lightbox
        item={lightboxItem}
        items={filtered}
        onClose={closeLightbox}
        onNavigate={setLightboxItem}
      />
    </main>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
        <ImageOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        No se encontraron imágenes
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Prueba con otra palabra, categoría o cambia el año.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium hover:bg-amber-400 transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
