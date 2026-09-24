"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Pin, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Photo } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

const fmtDateShort = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "";
  }
};

const sourceColor: Record<string, string> = {
  instagram: "bg-pink-500/85 text-white border-0",
  telegram: "bg-sky-500/85 text-white border-0",
  patreon: "bg-orange-500/85 text-white border-0",
  local: "bg-amber-500/85 text-amber-950 border-0",
  other: "bg-zinc-500/85 text-white border-0",
};

export function PhotoCard({
  photo,
  index,
}: {
  photo: Photo;
  index: number;
}) {
  // Aspecto basado en dimensiones o fallback
  const aspect =
    photo.width && photo.height
      ? `${photo.width} / ${photo.height}`
      : "3 / 4";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.02, 0.2),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="break-inside-avoid mb-3"
    >
      <Link
        href={`/photo/${photo.id}`}
        className="group relative block overflow-hidden rounded-xl bg-card border border-border/50 hover:border-amber-500/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
        aria-label={photo.title || "Ver foto"}
      >
        <div
          className="relative w-full overflow-hidden bg-muted/40"
          style={{ aspectRatio: aspect }}
        >
          <Image
            src={photo.thumb}
            alt={photo.title || `Foto de Douha Laribi`}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            unoptimized
          />

          {/* gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-95" />

          {/* top-left source chip */}
          <div className="absolute left-2 top-2 flex items-center gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${sourceColor[photo.source] || sourceColor.other}`}
            >
              {SOURCE_LABELS[photo.source] || photo.source}
            </span>
          </div>

          {/* top-right pin icon if pinned */}
          {photo.pinned && (
            <div className="absolute right-2 top-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/85 backdrop-blur text-amber-950">
                <Pin className="h-3 w-3" />
              </span>
            </div>
          )}

          {/* bottom info */}
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
            {photo.category && (
              <Badge
                variant="secondary"
                className="mb-1 bg-amber-500/85 text-amber-950 border-0 text-[10px] px-1.5 py-0 font-semibold"
              >
                {photo.category}
              </Badge>
            )}
            {photo.title && (
              <p className="text-xs font-medium leading-snug line-clamp-2 text-white/95">
                {photo.title}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2 text-[10px] text-white/70">
              {photo.date && (
                <span className="flex items-center gap-0.5">
                  <Calendar className="h-3 w-3" />
                  {fmtDateShort(photo.date)}
                </span>
              )}
              {photo.location && photo.location !== "—" && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {photo.location}
                </span>
              )}
              <span className="ml-auto flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {photo.views > 999 ? `${(photo.views / 1000).toFixed(1)}k` : photo.views}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
