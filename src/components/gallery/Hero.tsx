"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <header className="relative overflow-hidden border-b border-border/40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 30rem at 75% -10%, oklch(0.78 0.16 75 / 0.20), transparent 60%), radial-gradient(40rem 25rem at 5% 20%, oklch(0.55 0.16 30 / 0.14), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-14 sm:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start gap-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Archivo permanente de fans
          </div>

          <div className="space-y-2">
            <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              <span className="text-gold-gradient">Douha Laribi</span>{" "}
              <span className="text-foreground">Live</span>
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Todas las fotos de Douha Laribi (ضحى العريبي), organizadas y
              listas para redescubrir. Un archivo hecho por fans, para fans,
              que no depende de ninguna red social.
            </p>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
