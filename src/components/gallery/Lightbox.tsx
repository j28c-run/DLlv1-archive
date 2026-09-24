"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  ExternalLink,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GalleryItem } from "@/lib/gallery-data";

type LightboxProps = {
  item: GalleryItem | null;
  items: GalleryItem[];
  onClose: () => void;
  onNavigate: (item: GalleryItem) => void;
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export function Lightbox({
  item,
  items,
  onClose,
  onNavigate,
}: LightboxProps) {
  const currentIndex = item ? items.findIndex((i) => i.id === item.id) : -1;

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    onNavigate(items[currentIndex - 1]);
  }, [currentIndex, items, onNavigate]);

  const goNext = useCallback(() => {
    if (currentIndex < 0 || currentIndex >= items.length - 1) return;
    onNavigate(items[currentIndex + 1]);
  }, [currentIndex, items, onNavigate]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose, goPrev, goNext]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen: ${item.caption}`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10 text-foreground/80 hover:text-foreground hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </Button>

          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 text-foreground/70 hover:text-foreground hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {currentIndex < items.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 text-foreground/70 hover:text-foreground hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          <motion.div
            key={item.id}
            className="relative flex w-full max-w-5xl flex-col items-center gap-4 sm:flex-row sm:items-start"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-h-[72vh] sm:max-h-[80vh] overflow-hidden rounded-xl bg-black shadow-2xl shadow-amber-500/10">
              <Image
                src={item.src}
                alt={item.caption}
                width={1600}
                height={1200}
                className="mx-auto max-h-[72vh] sm:max-h-[80vh] w-auto object-contain"
                unoptimized
                priority
              />
            </div>

            <aside className="w-full sm:w-72 sm:shrink-0 text-left">
              <Badge
                variant="secondary"
                className="mb-3 bg-amber-500/15 text-amber-200 border-amber-500/30 hover:bg-amber-500/20"
              >
                {item.category}
              </Badge>

              <h3 className="text-lg font-semibold text-foreground leading-snug mb-3">
                {item.caption}
              </h3>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(item.date)}</span>
              </div>

              {item.tags.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                  <Tag className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground/70 mb-4">
                Imagen {currentIndex + 1} de {items.length}
              </div>

              {item.instagramUrl && (
                <a
                  href={item.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <Instagram className="h-4 w-4" />
                  Ver en Instagram
                  <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
              )}
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
