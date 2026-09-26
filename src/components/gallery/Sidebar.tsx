"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderOpen,
  Calendar,
  Tag as TagIcon,
  Sparkles,
  Pin,
  Search,
  Settings,
  Image as ImageIcon,
  Layers,
  X,
  ExternalLink,
  Heart,
  ChevronDown,
  Shuffle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

type Timeline = {
  years: Array<{
    year: string;
    total: number;
    months: Array<{ month: string; count: number }>;
  }>;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [stats, setStats] = useState<{
    total: number;
    categories: number;
    tags: number;
    years: number;
  } | null>(null);
  const [collections, setCollections] = useState<
    Array<{ id: string; name: string; photoCount: number }>
  >([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [topTags, setTopTags] = useState<Array<{ name: string; count: number }>>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [yearsOpen, setYearsOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
    fetch("/api/collections?withCover=1")
      .then((r) => r.json())
      .then((d) => setCollections(d.items || []))
      .catch(() => {});
    fetch("/api/photos/timeline")
      .then((r) => r.json())
      .then(setTimeline)
      .catch(() => {});
    fetch("/api/filters")
      .then((r) => r.json())
      .then((d) => {
        setTopTags((d.tags || []).slice(0, 12));
        setCats(d.categories || []);
      })
      .catch(() => {});
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.authenticated))
      .catch(() => {});
  }, []);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed top-14 bottom-0 left-0 z-40 w-72 border-r border-border/60 bg-card/40 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navegación lateral"
      >
        <div className="absolute top-2 right-2 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-full">
          <nav className="p-3 pt-4 space-y-1">
            <SectionTitle>Inicio</SectionTitle>
            <Item href="/" icon={<Home className="h-4 w-4" />} label="Galería" active={pathname === "/"} />
            <Item href="/?sort=popular" icon={<Sparkles className="h-4 w-4" />} label="Más vistas" />
            <Item href="/?pinned=true" icon={<Pin className="h-4 w-4" />} label="Destacadas" />
            <Item href="/?sort=oldest" icon={<Shuffle className="h-4 w-4" />} label="Más antiguas" />

            <SectionTitle className="mt-4">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                Colecciones
              </span>
            </SectionTitle>
            {collections.length === 0 ? (
              <p className="px-3 text-xs text-muted-foreground/70 py-1">
                Aún no hay colecciones
              </p>
            ) : (
              collections.slice(0, 8).map((c) => (
                <Item
                  key={c.id}
                  href={`/collections/${c.id}`}
                  icon={<FolderOpen className="h-4 w-4" />}
                  label={c.name}
                  badge={c.photoCount > 0 ? String(c.photoCount) : undefined}
                />
              ))
            )}
            <Item href="/collections" icon={<Layers className="h-4 w-4" />} label="Ver todas" muted />

            <Collapsible open={catsOpen} onOpenChange={setCatsOpen}>
              <SectionTitle className="mt-4">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 w-full text-left">
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !catsOpen && "-rotate-90")} />
                    Categorías
                  </button>
                </CollapsibleTrigger>
              </SectionTitle>
              <CollapsibleContent>
                <div className="space-y-1 mt-1">
                  {cats.map((c) => (
                    <Item
                      key={c}
                      href={`/category/${encodeURIComponent(c.toLowerCase())}`}
                      icon={<ImageIcon className="h-4 w-4" />}
                      label={c}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {timeline && timeline.years.length > 0 && (
              <Collapsible open={yearsOpen} onOpenChange={setYearsOpen}>
                <SectionTitle className="mt-4">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1 w-full text-left">
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !yearsOpen && "-rotate-90")} />
                      Por año
                    </button>
                  </CollapsibleTrigger>
                </SectionTitle>
                <CollapsibleContent>
                  <div className="space-y-1 mt-1">
                    {timeline.years.map((y) => (
                      <Item
                        key={y.year}
                        href={`/year/${y.year}`}
                        icon={<Calendar className="h-4 w-4" />}
                        label={y.year}
                        badge={String(y.total)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
              <SectionTitle className="mt-4">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 w-full text-left">
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !tagsOpen && "-rotate-90")} />
                    Etiquetas populares
                  </button>
                </CollapsibleTrigger>
              </SectionTitle>
              <CollapsibleContent>
                <div className="px-3 py-2 flex flex-wrap gap-1.5">
                  {topTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70">Aún no hay etiquetas</p>
                  ) : (
                    topTags.map((t) => (
                      <Link
                        key={t.name}
                        href={`/?tag=${encodeURIComponent(t.name)}`}
                        className="rounded-full bg-background/40 border border-border/60 hover:border-amber-500/40 hover:text-amber-100 text-[11px] text-muted-foreground px-2 py-0.5 transition-colors"
                      >
                        #{t.name}
                        <span className="ml-1 text-muted-foreground/60">{t.count}</span>
                      </Link>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <SectionTitle className="mt-4">Herramientas</SectionTitle>
            <Item href="/search" icon={<Search className="h-4 w-4" />} label="Búsqueda avanzada" active={pathname === "/search"} />

            <SectionTitle className="mt-4">Redes oficiales</SectionTitle>
            <a
              href="https://www.instagram.com/douhalaribilive/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Instagram
              <span className="ml-auto">
                <span className="h-2 w-2 rounded-full bg-pink-500 inline-block" />
              </span>
            </a>
            <a
              href="https://www.patreon.com/cw/DouhaLaribiLive"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
            >
              <Heart className="h-4 w-4 text-pink-500" />
              Patreon
            </a>

            {isAdmin && (
              <>
                <SectionTitle className="mt-4">Administración</SectionTitle>
                <Item href="/admin" icon={<Settings className="h-4 w-4" />} label="Panel admin" active={pathname.startsWith("/admin")} />
              </>
            )}

            {stats && (
              <div className="mt-6 mx-2 rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Estadísticas</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Fotos" value={stats.total} />
                  <Stat label="Categorías" value={stats.categories} />
                  <Stat label="Etiquetas" value={stats.tags} />
                  <Stat label="Años" value={stats.years} />
                </div>
              </div>
            )}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold", className)}>
      {children}
    </div>
  );
}

function Item({
  href,
  icon,
  label,
  active,
  badge,
  muted,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-amber-500/15 text-amber-100"
          : muted
            ? "text-muted-foreground/70 hover:bg-muted/40 hover:text-muted-foreground"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {badge && (
        <Badge variant="secondary" className="ml-auto bg-background/60 text-muted-foreground border-0 text-[10px] px-1.5 py-0">
          {badge}
        </Badge>
      )}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-base font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
