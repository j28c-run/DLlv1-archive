"use client";

import { Search, X, ArrowDownUp, Calendar, Tag as TagIcon, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Filters } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

export type FilterState = {
  q: string;
  category: string;
  source: string;
  year: string;
  tag: string;
  sort: "recent" | "oldest" | "popular";
};

type Props = {
  state: FilterState;
  setState: (s: FilterState) => void;
  filters: Filters | null;
  resultsCount: number;
  totalCount: number;
  onClear: () => void;
};

export function FilterBar({
  state,
  setState,
  filters,
  resultsCount,
  totalCount,
  onClear,
}: Props) {
  const hasFilters =
    state.q.trim() !== "" ||
    state.category !== "Todas" ||
    state.source !== "Todas" ||
    state.year !== "Todos" ||
    state.tag !== "";

  const set = (patch: Partial<FilterState>) =>
    setState({ ...state, ...patch });

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-3 sm:p-4 shadow-lg shadow-black/20">
      {/* Search row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={state.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Buscar por título, descripción o lugar…"
            className="pl-9 pr-9 bg-background/60 border-border/60 focus-visible:ring-amber-500/40 h-10"
            aria-label="Buscar imágenes"
          />
          {state.q && (
            <button
              type="button"
              onClick={() => set({ q: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Borrar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select
            value={state.sort}
            onValueChange={(v) =>
              set({ sort: v as FilterState["sort"] })
            }
          >
            <SelectTrigger
              className="w-[150px] bg-background/60 border-border/60 h-10"
              aria-label="Ordenar"
            >
              <ArrowDownUp className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguas</SelectItem>
              <SelectItem value="popular">Más vistas</SelectItem>
            </SelectContent>
          </Select>

          {/* Tag filter popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-background/60 border-border/60"
                aria-label="Etiquetas"
              >
                <TagIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="end">
              <div className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TagIcon className="h-3 w-3" />
                Etiquetas ({filters?.tags.length || 0})
              </div>
              <div className="max-h-72 overflow-y-auto pr-1 space-y-1">
                <button
                  type="button"
                  onClick={() => set({ tag: "" })}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between",
                    state.tag === ""
                      ? "bg-amber-500/15 text-amber-200"
                      : "hover:bg-muted"
                  )}
                >
                  Todas las etiquetas
                </button>
                {filters?.tags.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => set({ tag: t.name })}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between",
                      state.tag === t.name
                        ? "bg-amber-500/15 text-amber-200"
                        : "hover:bg-muted"
                    )}
                  >
                    <span>#{t.name}</span>
                    <span className="text-muted-foreground">{t.count}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Year */}
          <Select
            value={state.year}
            onValueChange={(v) => set({ year: v })}
          >
            <SelectTrigger
              className="w-[130px] bg-background/60 border-border/60 h-10"
              aria-label="Año"
            >
              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los años</SelectItem>
              {filters?.years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source */}
          <Select
            value={state.source}
            onValueChange={(v) => set({ source: v })}
          >
            <SelectTrigger
              className="w-[140px] bg-background/60 border-border/60 h-10 hidden md:flex"
              aria-label="Fuente"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas las fuentes</SelectItem>
              {filters?.sources.map((s) => (
                <SelectItem key={s} value={s}>
                  {SOURCE_LABELS[s] || s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category chips row */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <Chip
          active={state.category === "Todas"}
          onClick={() => set({ category: "Todas" })}
        >
          Todas
        </Chip>
        {filters?.categories.map((c) => (
          <Chip
            key={c}
            active={state.category === c}
            onClick={() => set({ category: c })}
          >
            {c}
          </Chip>
        ))}
      </div>

      {/* Active tag indicator + summary */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground gap-2">
        <span>
          {state.tag && (
            <span className="inline-flex items-center gap-1 mr-2 rounded-full bg-amber-500/15 text-amber-200 px-2 py-0.5">
              #{state.tag}
              <button
                type="button"
                onClick={() => set({ tag: "" })}
                aria-label="Quitar etiqueta"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          Mostrando{" "}
          <span className="text-amber-200 font-semibold">{resultsCount}</span>{" "}
          de {totalCount} fotos
        </span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

function Chip({
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
          : "bg-background/40 text-muted-foreground border-border/60 hover:border-amber-500/40 hover:text-amber-100"
      )}
    >
      {children}
    </button>
  );
}
