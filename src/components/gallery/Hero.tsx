"use client";

import { motion } from "framer-motion";
import { Instagram, Images, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroProps = {
  totalPhotos: number;
  categories: number;
  years: number;
  events: number;
};

export function Hero({ totalPhotos, categories, years, events }: HeroProps) {
  return (
    <header className="relative overflow-hidden">
      {/* Glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 30rem at 70% -10%, oklch(0.78 0.16 75 / 0.20), transparent 60%), radial-gradient(40rem 25rem at 0% 30%, oklch(0.55 0.16 30 / 0.12), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-20 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start gap-6"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            Fan Page · Galería no oficial
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="font-sans text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              <span className="text-gold-gradient">Douhal Aribi</span>
              <br />
              <span className="text-foreground">Live</span>
            </h1>
            <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Un archivo visual de los mejores momentos. Explora, busca y
              redescubre cada foto sin que se pierda entre publicaciones.
              Hecho por fans, para fans.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://www.instagram.com/douhalaribilive/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 text-white hover:opacity-90 border-0"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Seguir en Instagram
              </Button>
            </a>
            <a href="#galeria">
              <Button
                size="lg"
                variant="outline"
                className="border-amber-500/40 text-amber-100 hover:bg-amber-500/10 hover:text-amber-50"
              >
                Ver la galería
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
            <StatCard
              icon={<Images className="h-4 w-4" />}
              value={totalPhotos}
              label="Fotos"
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" />}
              value={categories}
              label="Categorías"
            />
            <StatCard
              icon={<Calendar className="h-4 w-4" />}
              value={years}
              label="Años"
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" />}
              value={events}
              label="Eventos"
            />
          </div>
        </motion.div>
      </div>
    </header>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex items-center gap-1.5 text-amber-300 mb-1">
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground leading-none">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
