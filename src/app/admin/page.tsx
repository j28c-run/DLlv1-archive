"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Pin,
  Search,
  ExternalLink,
  Eye,
  Calendar,
  Sparkles,
  Layers,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Navbar } from "@/components/gallery/Navbar";
import { Sidebar } from "@/components/gallery/Sidebar";
import { BulkUpload } from "@/components/admin/BulkUpload";
import type { Filters, Photo } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

type EditState = {
  id?: string;
  src: string;
  thumb: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  source: string;
  sourceUrl: string;
  tags: string;
  pinned: boolean;
};

const EMPTY: EditState = {
  src: "",
  thumb: "",
  title: "",
  description: "",
  date: "",
  location: "",
  category: "",
  source: "local",
  sourceUrl: "",
  tags: "",
  pinned: false,
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("Todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<EditState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) {
          router.replace("/login");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  // Cargar filtros
  useEffect(() => {
    if (!authChecked) return;
    fetch("/api/filters")
      .then((r) => r.json())
      .then(setFilters)
      .catch(() => {});
  }, [authChecked]);

  // Cargar fotos (todas, con búsqueda simple)
  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: "60",
      sort: "recent",
      category,
    });
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/photos?${params}`);
    const data = await res.json();
    setPhotos(data.items || []);
    setLoading(false);
  }, [q, category]);

  useEffect(() => {
    if (!authChecked) return;
    const t = setTimeout(loadPhotos, 300);
    return () => clearTimeout(t);
  }, [authChecked, loadPhotos]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  };

  const openNew = () => {
    setEditing(EMPTY);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Photo) => {
    setEditing({
      id: p.id,
      src: p.src,
      thumb: p.thumb || "",
      title: p.title || "",
      description: p.description || "",
      date: p.date ? p.date.slice(0, 10) : "",
      location: p.location || "",
      category: p.category || "",
      source: p.source,
      sourceUrl: p.sourceUrl || "",
      tags: p.tags.join(", "),
      pinned: p.pinned,
    });
    setError(null);
    setDialogOpen(true);
  };

  const save = async () => {
    setError(null);
    if (!editing.src.trim()) {
      setError("La URL de la imagen es obligatoria");
      return;
    }
    setSaving(true);
    try {
      const body = {
        src: editing.src.trim(),
        thumb: editing.thumb.trim() || null,
        title: editing.title.trim() || null,
        description: editing.description.trim() || null,
        date: editing.date || null,
        location: editing.location.trim() || null,
        category: editing.category.trim() || null,
        source: editing.source,
        sourceUrl: editing.sourceUrl.trim() || null,
        tags: editing.tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        pinned: editing.pinned,
        autoAnalyze: false, // en edición manual, no re-analizar
      };
      const url = editing.id
        ? `/api/photos/${editing.id}`
        : "/api/photos/create";
      const method = editing.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al guardar");
      }
      setDialogOpen(false);
      loadPhotos();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar esta foto permanentemente?")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    loadPhotos();
  };

  const togglePin = async (p: Photo) => {
    await fetch(`/api/photos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !p.pinned }),
    });
    loadPhotos();
  };

  const analyze = async (p: Photo) => {
    setAnalyzingId(p.id);
    try {
      const res = await fetch(`/api/photos/${p.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ override: true }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al analizar");
      }
      loadPhotos();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <Sidebar open={false} onClose={() => {}} />
        <div className="lg:pl-72 flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Sidebar open={false} onClose={() => {}} />
      <div className="lg:pl-72">
      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Panel de administración
            </h1>
            <p className="text-sm text-muted-foreground">
              Sube, edita y organiza las fotos del archivo
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setBulkOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-pink-500 text-white hover:opacity-90 border-0"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Subida masiva
            </Button>
            <Button onClick={openNew} variant="outline" className="border-amber-500/40 text-amber-100 hover:bg-amber-500/10">
              <Plus className="h-4 w-4 mr-1.5" />
              Foto única
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1.5" />
              Salir
            </Button>
          </div>
        </div>

        {/* Quick filters */}
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título, descripción o lugar…"
                className="pl-9 bg-background/60 border-border/60"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background/60 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas las categorías</SelectItem>
                {filters?.categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {loading ? "Cargando…" : `${photos.length} fotos mostradas`}
          </div>
        </div>

        {/* Grid of photos with admin actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-lg bg-card border border-border/60"
            >
              <div className="relative aspect-square">
                <Image
                  src={p.thumb}
                  alt={p.title || "Foto"}
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
                {/* overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* pinned badge */}
                {p.pinned && (
                  <Badge className="absolute top-1.5 left-1.5 bg-amber-500 text-amber-950 border-0 text-[10px] px-1.5 py-0">
                    <Pin className="h-2.5 w-2.5 mr-0.5" />
                    Fijada
                  </Badge>
                )}

                {/* source */}
                <Badge className="absolute top-1.5 right-1.5 bg-background/70 text-foreground border-0 text-[10px] px-1.5 py-0 backdrop-blur">
                  {SOURCE_LABELS[p.source]?.slice(0, 3) || p.source}
                </Badge>

                {/* actions */}
                <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 bg-background/80 backdrop-blur"
                      onClick={() => openEdit(p)}
                      title="Editar"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 bg-background/80 backdrop-blur"
                      onClick={() => analyze(p)}
                      title="Re-analizar con IA"
                      disabled={analyzingId === p.id}
                    >
                      {analyzingId === p.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-amber-400" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 bg-background/80 backdrop-blur"
                      onClick={() => togglePin(p)}
                      title={p.pinned ? "Desfijar" : "Fijar"}
                    >
                      <Pin className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 bg-destructive/80 text-white hover:bg-destructive backdrop-blur"
                      onClick={() => del(p.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <a
                      href={`/photo/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto"
                    >
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 bg-background/80 backdrop-blur"
                        title="Ver en la galería"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
              {/* caption */}
              <div className="p-2">
                <p className="text-xs font-medium line-clamp-1">
                  {p.title || "Sin título"}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    {fmtDate(p.date)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-2.5 w-2.5" />
                    {p.views}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && !loading && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No hay fotos todavía. Haz clic en "Subida masiva" para empezar.
          </div>
        )}
      </div>
      </div>

      {/* Dialog: foto única */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing.id ? "Editar foto" : "Subir nueva foto"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Preview */}
            {editing.src && (
              <div className="rounded-lg overflow-hidden bg-black/40 border border-border/60 flex items-center justify-center max-h-60">
                <img
                  src={editing.src}
                  alt="Preview"
                  className="max-h-60 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="src">URL de la imagen *</Label>
              <Input
                id="src"
                value={editing.src}
                onChange={(e) =>
                  setEditing({ ...editing, src: e.target.value })
                }
                placeholder="https://… (URL directa de Instagram/Telegram/etc. o de tu servidor)"
              />
              <p className="text-xs text-muted-foreground">
                Pega aquí la URL directa de la imagen (.jpg, .png, .webp). En
                breve también podrás subir archivos directamente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  placeholder="Ej: Sesión primaveral en Casablanca"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                  placeholder="Retratos, Looks, Live, Eventos…"
                  list="cats"
                />
                <datalist id="cats">
                  {filters?.categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                placeholder="Notas, contexto, anécdota…"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha de la foto</Label>
                <Input
                  id="date"
                  type="date"
                  value={editing.date}
                  onChange={(e) =>
                    setEditing({ ...editing, date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Lugar</Label>
                <Input
                  id="location"
                  value={editing.location}
                  onChange={(e) =>
                    setEditing({ ...editing, location: e.target.value })
                  }
                  placeholder="Casablanca, Madrid, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="source">Fuente</Label>
                <Select
                  value={editing.source}
                  onValueChange={(v) =>
                    setEditing({ ...editing, source: v })
                  }
                >
                  <SelectTrigger id="source" className="bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Subida local</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="patreon">Patreon</SelectItem>
                    <SelectItem value="other">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sourceUrl">URL de la fuente</Label>
                <Input
                  id="sourceUrl"
                  value={editing.sourceUrl}
                  onChange={(e) =>
                    setEditing({ ...editing, sourceUrl: e.target.value })
                  }
                  placeholder="https://instagram.com/p/… (opcional)"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
              <Input
                id="tags"
                value={editing.tags}
                onChange={(e) =>
                  setEditing({ ...editing, tags: e.target.value })
                }
                placeholder="hijab, retrato, verano, casablanca"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div>
                <Label htmlFor="pinned" className="cursor-pointer">
                  Fijar como destacada
                </Label>
                <p className="text-xs text-muted-foreground">
                  Aparecerá primero en la galería
                </p>
              </div>
              <Switch
                id="pinned"
                checked={editing.pinned}
                onCheckedChange={(v) =>
                  setEditing({ ...editing, pinned: v })
                }
              />
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-amber-500 text-amber-950 hover:bg-amber-400 border-0"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              {editing.id ? "Guardar cambios" : "Subir foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: subida masiva */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subida masiva de fotos</DialogTitle>
          </DialogHeader>
          <BulkUpload filters={filters} onDone={loadPhotos} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
