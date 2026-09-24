"use client";

import { Search, X, ArrowDownUp, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { GalleryCategory } from "@/lib/gallery-data";

type FilterBarProps = {
  query: string;
  setQuery: (v: string) => void;
  activeCategory: GalleryCategory | "Todas";
  setActiveCategory: (c: GalleryCategory | "Todas") => void;
  activeYear: string | "Todos";
  setActiveYear: (y: string | "Todos") => void;
  sort: "recent" | "oldest";
  setSort: (s: "recent" | "oldest") => void;
  categories: readonly GalleryCategory[];
  years: string[];
  resultsCount: number;
  totalCount: number;
  onClear: () => void;
};

export function FilterBar(props: FilterBarProps) {
  const {
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    activeYear,
    setActiveYear,
    sort,
    setSort,
    categories,
    years,
    resultsCount,
    totalCount,
    onClear,
  } = props;

  const hasFilters =
    query.trim() !== "" ||
    activeCategory !== "Todas" ||
    activeYear !== "Todos";

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-3 sm:p-4 shadow-lg shadow-black/20">
      {/* Search row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, categoría o etiqueta…"
            className="pl-9 pr-9 bg-background/60 border-border/60 focus-visible:ring-amber-500/40"
            aria-label="Buscar imágenes"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Borrar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Year select */}
          <Select
            value={activeYear}
            onValueChange={(v) => setActiveYear(v)}
          >
            <SelectTrigger
              className="w-[130px] bg-background/60 border-border/60"
              aria-label="Filtrar por año"
            >
              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los años</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as "recent" | "oldest")}
          >
            <SelectTrigger
              className="w-[140px] bg-background/60 border-border/60"
              aria-label="Ordenar"
            >
              <ArrowDownUp className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category chips row */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0">
          Categorías:
        </span>
        <CategoryChip
          active={activeCategory === "Todas"}
          onClick={() => setActiveCategory("Todas")}
        >
          Todas
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip
            key={c}
            active={activeCategory === c}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </CategoryChip>
        ))}
      </div>

      {/* Results summary + clear */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Mostrando <span className="text-amber-200 font-semibold">{resultsCount}</span>{" "}
          de {totalCount} imágenes
        </span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all border",
        active
          ? "bg-amber-500 text-amber-950 border-amber-400 shadow-sm shadow-amber-500/30"
          : "bg-background/40 text-muted-foreground border-border/60 hover:border-amber-500/40 hover:text-amber-100",
      )}
    >
      {children}
    </button>
  );
}

// Avoid unused import warning if Badge isn't used directly
export const _Badge = Badge;
