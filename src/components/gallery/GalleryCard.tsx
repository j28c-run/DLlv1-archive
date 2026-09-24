"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Maximize2, Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GalleryItem } from "@/lib/gallery-data";

type GalleryCardProps = {
  item: GalleryItem;
  onOpen: (item: GalleryItem) => void;
  index: number;
};

const formatDateShort = (iso: string) => {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return iso;
  }
};

const aspectClass = (aspect: GalleryItem["aspect"]) => {
  switch (aspect) {
    case "portrait":
      return "aspect-[4/5]";
    case "tall":
      return "aspect-[3/4.5]";
    case "square":
      return "aspect-square";
    case "landscape":
    default:
      return "aspect-[3/2]";
  }
};

export function GalleryCard({ item, onOpen, index }: GalleryCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(item)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.025, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -3 }}
      className="group relative w-full overflow-hidden rounded-xl bg-card border border-border/60 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`Abrir imagen: ${item.caption}`}
    >
      {/* Image */}
      <div className={`relative w-full ${aspectClass(item.aspect)} overflow-hidden bg-muted/40`}>
        <Image
          src={item.thumb}
          alt={item.caption}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          unoptimized
        />
        {/* gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

        {/* top-right zoom hint */}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur px-2 py-1 text-[10px] text-amber-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Maximize2 className="h-3 w-3" />
          Ver
        </div>

        {/* top-left instagram icon if linked */}
        {item.instagramUrl && (
          <div className="absolute left-2 top-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-pink-500/80 backdrop-blur text-white">
              <Instagram className="h-3 w-3" />
            </span>
          </div>
        )}

        {/* bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-amber-500/80 text-amber-950 border-0 text-[10px] px-2 py-0.5 font-semibold"
            >
              {item.category}
            </Badge>
            <span className="flex items-center gap-1 text-[10px] text-white/80">
              <Calendar className="h-3 w-3" />
              {formatDateShort(item.date)}
            </span>
          </div>
          <p className="text-sm font-medium leading-snug line-clamp-2 text-white/95">
            {item.caption}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
