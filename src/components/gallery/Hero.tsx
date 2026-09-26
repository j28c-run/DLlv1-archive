"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Pause,
  Play,
  Pin,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Photo } from "@/lib/types";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const HERO_SUBTITLES = [
  "Todas las fotos de Douha Laribi (ضحى العريبي), organizadas y listas para redescubrir. Un archivo hecho por fans, para fans, que no depende de ninguna red social.",
  "Recopilación permanente de momentos: lives, looks, retratos y behind the scenes. Todo en un solo lugar.",
  "Explora el archivo visual completo, sin algoritmos ni feed infinito. Busca, encuentra y redescubre.",
];

export function Hero() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/photos/slider?limit=8")
      .then((r) => r.json())
      .then((d) => {
        setPhotos(d.items || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const total = photos.length;
  const current = photos[index];
  const currentSubtitle = HERO_SUBTITLES[index % HERO_SUBTITLES.length];

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => (i <= 0 ? total - 1 : i - 1));
  }, [total]);

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i >= total - 1 ? 0 : i + 1));
  }, [total]);

  useEffect(() => {
    if (!playing || total <= 1) return;
    const t = setInterval(goNext, 5000);
    return () => clearInterval(t);
  }, [playing, total, goNext]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(0);
  }, [photos.length]);

  // En modo compacto: menos info. En modo ampliado: más info y controles completos.
  // Alturas: compacto = 200/220/240; ampliado = 420/480/520 (lo que teníamos antes)
  const heightClass = expanded
    ? "h-[420px] sm:h-[480px] lg:h-[520px]"
    : "h-[200px] sm:h-[240px] lg:h-[260px]";

  return (
    <header
      className={`relative overflow-hidden border-b border-border/40 transition-[height] duration-500 ease-out ${heightClass}`}
    >
      {/* Background images slider */}
      {total > 0 ? (
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.div
            key={current?.id || index}
            custom={direction}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {current && (
              <Image
                src={current.src}
                alt={current.title || "Douha Laribi"}
                fill
                sizes="100vw"
                className="object-cover"
                priority
                unoptimized
              />
            )}
            {/* Overlay gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60rem 30rem at 75% -10%, oklch(0.78 0.16 75 / 0.20), transparent 60%), radial-gradient(40rem 25rem at 5% 20%, oklch(0.55 0.16 30 / 0.14), transparent 60%)",
          }}
        />
      )}

      {/* Contenido */}
      <div className="relative h-full mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-4 sm:pb-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start gap-2 sm:gap-3 max-w-3xl"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-amber-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Archivo permanente de fans
            </div>

            {/* Título */}
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.02] drop-shadow-lg">
              <span className="text-gold-gradient">Douha Laribi</span>{" "}
              <span className="text-foreground">Live</span>
            </h1>

            {/* Subtítulo (solo en modo ampliado para no saturar el compacto) */}
            {expanded && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl text-sm sm:text-base lg:text-lg text-foreground/90 leading-relaxed drop-shadow"
              >
                {currentSubtitle}
              </motion.p>
            )}

            {/* Info de la foto actual (solo en modo ampliado) */}
            {expanded && current && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center gap-2 mt-1"
              >
                {current.category && (
                  <Badge className="bg-amber-500/85 text-amber-950 border-0 backdrop-blur">
                    {current.category}
                  </Badge>
                )}
                {current.pinned && (
                  <Badge className="bg-pink-500/85 text-white border-0 backdrop-blur">
                    <Pin className="h-3 w-3 mr-1" />
                    Destacada
                  </Badge>
                )}
                {current.date && (
                  <span className="flex items-center gap-1 text-xs text-foreground/80 backdrop-blur bg-background/40 px-2 py-1 rounded-full">
                    <Calendar className="h-3 w-3" />
                    {fmtDate(current.date)}
                  </span>
                )}
                {current.location && current.location !== "—" && (
                  <span className="flex items-center gap-1 text-xs text-foreground/80 backdrop-blur bg-background/40 px-2 py-1 rounded-full">
                    <MapPin className="h-3 w-3" />
                    {current.location}
                  </span>
                )}
                {current.title && (
                  <Link
                    href={`/photo/${current.id}`}
                    className="ml-2 text-xs text-amber-200 hover:text-amber-100 underline-offset-2 hover:underline backdrop-blur"
                  >
                    Ver esta foto →
                  </Link>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles del slider (siempre visibles, pero más compactos cuando no está expandido) */}
      {total > 1 && (
        <>
          {/* Botón anterior */}
          {expanded && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-background/40 backdrop-blur-md border border-border/60 text-foreground hover:bg-background/70 hover:border-amber-500/40 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Botón siguiente */}
          {expanded && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-background/40 backdrop-blur-md border border-border/60 text-foreground hover:bg-background/70 hover:border-amber-500/40 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Botón play/pausa (solo en expandido) */}
          {expanded && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pausar" : "Reproducir"}
              className="absolute right-3 bottom-3 sm:bottom-4 z-10 h-9 w-9 rounded-full bg-background/40 backdrop-blur-md border border-border/60 text-foreground hover:bg-background/70 transition-colors flex items-center justify-center"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          )}

          {/* Botón expandir/contraer (siempre visible, arriba a la derecha) */}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Contraer slider" : "Ampliar slider"}
            className="absolute right-3 top-3 z-20 h-9 w-9 rounded-full bg-background/40 backdrop-blur-md border border-border/60 text-foreground hover:bg-background/70 hover:border-amber-500/40 transition-colors flex items-center justify-center"
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Indicadores (dots) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                aria-label={`Ir a foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? expanded
                      ? "w-8 bg-amber-400"
                      : "w-6 bg-amber-400"
                    : "w-1.5 bg-foreground/40 hover:bg-foreground/60"
                }`}
              />
            ))}
          </div>

          {/* Contador (solo en expandido) */}
          {expanded && (
            <div className="absolute left-3 bottom-3 sm:bottom-4 z-10 text-xs text-foreground/70 backdrop-blur bg-background/40 px-2 py-1 rounded-full tabular-nums">
              {index + 1} / {total}
            </div>
          )}
        </>
      )}

      {!loaded && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse" />
      )}
    </header>
  );
}
