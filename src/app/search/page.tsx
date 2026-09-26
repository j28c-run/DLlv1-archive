"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2, X, Sparkles } from "lucide-react";
import { Navbar } from "@/components/gallery/Navbar";
import { Sidebar } from "@/components/gallery/Sidebar";
import { PhotoCard } from "@/components/gallery/PhotoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useInfinite } from "@/hooks/use-infinite";
import type { Filters, Photo } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

export default function SearchPage() {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("Todas");
  const [source, setSource] = useState("Todas");
  const [year, setYear] = useState("Todos");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<"any" | "all">("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);

  useEffect(() => {
    fetch("/api/filters").then((r) => r.json()).then(setFilters).catch(() => {});
  }, []);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetcher = useCallback(
    async (cursor: string | null) => {
      const params = new URLSearchParams({
        limit: "30",
        sort: "recent",
        category,
        source,
        year,
        tagMode,
      });
      if (debouncedQ) params.set("q", debouncedQ);
      if (tags.length) params.set("tag", tags.join(","));
      if (pinnedOnly) params.set("pinned", "true");
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/photos?${params}`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    [debouncedQ, category, source, year, tags, tagMode, pinnedOnly],
  );

  const { data, loading, hasMore, loadMoreRef } = useInfinite<Photo>(fetcher, [
    debouncedQ, category, source, year, tags.join(","), tagMode, pinnedOnly,
  ]);

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Sidebar open={false} onClose={() => {}} />
      <div className="lg:pl-72">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver
            </Link>
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Búsqueda avanzada</h1>
          <p className="text-sm text-muted-foreground mb-6">Combina filtros para encontrar exactamente lo que buscas</p>

          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título, descripción o lugar…"
                className="pl-9 bg-background/60 border-border/60"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background/60 border-border/60"><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas las categorías</SelectItem>
                  {filters?.categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="bg-background/60 border-border/60"><SelectValue placeholder="Fuente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas las fuentes</SelectItem>
                  {filters?.sources.map((s) => (<SelectItem key={s} value={s}>{SOURCE_LABELS[s] || s}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="bg-background/60 border-border/60"><SelectValue placeholder="Año" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos los años</SelectItem>
                  {filters?.years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Añade etiquetas (Enter)"
                  className="bg-background/60 border-border/60"
                />
                <Button onClick={addTag} variant="outline">Añadir</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {tags.map((t) => (
                    <Badge key={t} className="bg-amber-500/15 text-amber-200 border-amber-500/30 gap-1">
                      #{t}
                      <button onClick={() => removeTag(t)} aria-label="Quitar"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1 ml-2 text-xs">
                    <Label className="cursor-pointer">Coincidir:</Label>
                    <Select value={tagMode} onValueChange={(v) => setTagMode(v as "any" | "all")}>
                      <SelectTrigger className="h-7 w-32 bg-background/60 border-border/60 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas (Y)</SelectItem>
                        <SelectItem value="any">Cualquiera (O)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <Label className="cursor-pointer">Solo destacadas</Label>
                <p className="text-xs text-muted-foreground">Mostrar únicamente fotos fijadas</p>
              </div>
              <Switch checked={pinnedOnly} onCheckedChange={setPinnedOnly} />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>{loading ? "Buscando…" : `${data.length} resultado(s)`}</span>
          </div>

          {data.length === 0 && !loading ? (
            <div className="text-center py-20 text-sm text-muted-foreground">
              No se encontraron fotos con esos filtros.
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3">
              {data.map((p, idx) => (<PhotoCard key={p.id} photo={p} index={idx} />))}
            </div>
          )}

          <div ref={loadMoreRef} className="py-6 flex items-center justify-center">
            {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!loading && !hasMore && data.length > 0 && (
              <span className="text-xs text-muted-foreground">Has llegado al final</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
