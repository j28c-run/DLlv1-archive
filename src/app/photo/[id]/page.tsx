"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Eye,
  Tag as TagIcon,
  ExternalLink,
  Heart,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/gallery/Navbar";
import { Sidebar } from "@/components/gallery/Sidebar";
import { SOURCE_LABELS, type PhotoDetail } from "@/lib/types";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export default function PhotoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [photo, setPhoto] = useState<PhotoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/photos/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No encontrada");
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setPhoto(d);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <Sidebar open={false} onClose={() => {}} />
        <div className="lg:pl-72 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (error || !photo) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <Sidebar open={false} onClose={() => {}} />
        <div className="lg:pl-72 flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-muted-foreground">No se encontró la foto.</p>
          <Link href="/">
            <Button>Volver a la galería</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Sidebar open={false} onClose={() => {}} />
      <div className="lg:pl-72">
      <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-4 lg:px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Volver
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-4 lg:grid-cols-[1fr_320px]"
        >
          {/* Image */}
          <div className="relative overflow-hidden rounded-xl bg-black flex items-center justify-center">
            <Image
              src={photo.src}
              alt={photo.title || "Foto de Douha Laribi"}
              width={photo.width || 1200}
              height={photo.height || 1500}
              className="mx-auto max-h-[80vh] w-auto object-contain"
              unoptimized
              priority
            />
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-3">
            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {photo.category && (
                  <Badge className="bg-amber-500/85 text-amber-950 border-0">
                    {photo.category}
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className="bg-background/60 text-muted-foreground border-border/60"
                >
                  {SOURCE_LABELS[photo.source] || photo.source}
                </Badge>
                {photo.pinned && (
                  <Badge className="bg-pink-500/85 text-white border-0">
                    Destacada
                  </Badge>
                )}
              </div>

              <h1 className="text-lg font-semibold text-foreground leading-snug mb-3">
                {photo.title || "Sin título"}
              </h1>

              {photo.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {photo.description}
                </p>
              )}

              <div className="space-y-1.5 text-sm">
                {photo.date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {fmtDate(photo.date)}
                  </div>
                )}
                {photo.location && photo.location !== "—" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {photo.location}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {photo.views} vistas
                </div>
              </div>

              {photo.tags.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <TagIcon className="h-3 w-3" />
                    Etiquetas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {photo.tags.map((t) => (
                      <Link
                        key={t}
                        href={`/?tag=${encodeURIComponent(t)}`}
                        className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-muted-foreground hover:text-amber-200 hover:border-amber-500/30 transition-colors"
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {photo.sourceUrl && (
                <a
                  href={photo.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity w-full justify-center"
                >
                  <Heart className="h-4 w-4" />
                  Ver fuente original
                  <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
              )}
            </div>
          </aside>
        </motion.div>

        {/* Relacionadas */}
        {photo.related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-amber-500" />
              Fotos relacionadas
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {photo.related.map((r) => (
                <Link
                  key={r.id}
                  href={`/photo/${r.id}`}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-card border border-border/50 hover:border-amber-500/40 transition-colors"
                >
                  <Image
                    src={r.thumb}
                    alt={r.title || "Foto relacionada"}
                    fill
                    sizes="150px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    unoptimized
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      </div>
    </main>
  );
}
