"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bookmark,
  Share2,
  Download,
  Loader2,
  Check,
  Link2,
  Send,
  Twitter,
  Facebook,
  Plus,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Collection = { id: string; name: string };

type Props = {
  photoId: string;
  size?: "sm" | "md" | "lg";
  variant?: "overlay" | "default";
  className?: string;
  /** Si ya se conoce en qué colecciones está (ej. desde el detalle), pasarlas aquí */
  initialSavedIn?: string[];
  /** Si ya está cargada la lista completa de colecciones, pasarlas aquí */
  initialCollections?: Collection[];
};

export function PhotoActions({
  photoId,
  size = "sm",
  variant = "default",
  className,
  initialSavedIn,
  initialCollections,
}: Props) {
  const [collections, setCollections] = useState<Collection[]>(
    initialCollections || [],
  );
  const [savedIn, setSavedIn] = useState<Set<string>>(
    new Set(initialSavedIn || []),
  );
  const [loadingCols, setLoadingCols] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const loadedRef = useRef(false);

  // Cargar colecciones + estado de guardado cuando se abre el popover (lazy)
  // (excepto si ya vino con initialSavedIn / initialCollections)
  const loadCollections = async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoadingCols(true);
    try {
      const [colsRes, savedRes] = await Promise.all([
        fetch("/api/collections"),
        fetch(`/api/photos/${photoId}/collections`),
      ]);
      const colsData = await colsRes.json();
      const savedData = await savedRes.json();
      if (!initialCollections) {
        setCollections(colsData.items || []);
      }
      if (!initialSavedIn) {
        setSavedIn(
          new Set((savedData.collections || []).map((c: Collection) => c.id)),
        );
      }
    } catch {
      // ignore
    } finally {
      setLoadingCols(false);
    }
  };

  // Si hay datos iniciales, marcar como ya cargado
  useEffect(() => {
    if (initialCollections || initialSavedIn) {
      loadedRef.current = true;
    }
  }, [initialCollections, initialSavedIn]);

  const toggleSave = async (colId: string) => {
    const isSaved = savedIn.has(colId);
    // Optimistic UI
    setSavedIn((prev) => {
      const n = new Set(prev);
      if (isSaved) n.delete(colId);
      else n.add(colId);
      return n;
    });
    try {
      if (isSaved) {
        await fetch(`/api/collections/${colId}/photos?photoId=${photoId}`, {
          method: "DELETE",
        });
        toast({ title: "Quitada de la colección" });
      } else {
        await fetch(`/api/collections/${colId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId }),
        });
        toast({ title: "Añadida a la colección" });
      }
    } catch {
      // Revertir en error
      setSavedIn((prev) => {
        const n = new Set(prev);
        if (isSaved) n.add(colId);
        else n.delete(colId);
        return n;
      });
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    }
  };

  const createCollection = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      const newCol = { id: data.id, name: data.name };
      setCollections((prev) => [newCol, ...prev]);
      // Auto-añadir la foto a la nueva colección
      await fetch(`/api/collections/${data.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      setSavedIn((prev) => new Set(prev).add(data.id));
      toast({ title: "Colección creada", description: `Y foto añadida a "${newName}"` });
      setNewName("");
      setCreateOpen(false);
    } catch {
      toast({ title: "Error", description: "No se pudo crear", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/photo/${photoId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Enlace copiado" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  const shareTo = (network: "whatsapp" | "telegram" | "twitter" | "facebook") => {
    const url = `${window.location.origin}/photo/${photoId}`;
    const text = encodeURIComponent("Foto de Douha Laribi");
    const encodedUrl = encodeURIComponent(url);
    const map: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };
    window.open(map[network], "_blank", "noopener,noreferrer,width=600,height=500");
    setShareOpen(false);
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/download`);
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") || "";
      const m = cd.match(/filename="([^"]+)"/);
      a.download = m?.[1] || `douhal-${photoId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Descarga iniciada" });
    } catch (e: any) {
      toast({
        title: "Error al descargar",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const btnClass = cn(
    "bg-background/80 backdrop-blur hover:bg-background/95 border border-border/40",
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-9 w-9",
    variant === "overlay" && "text-white border-white/20 bg-black/50 hover:bg-black/70",
  );

  const iconClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  const savedCount = savedIn.size;

  return (
    <>
      <div className={cn("flex items-center gap-1", className)}>
        {/* Guardar en colección */}
        <Popover
          open={saveOpen}
          onOpenChange={(open) => {
            setSaveOpen(open);
            if (open) loadCollections();
          }}
        >
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                btnClass,
                savedCount > 0 &&
                  variant === "overlay" &&
                  "bg-amber-500/90 hover:bg-amber-500 border-amber-400 text-amber-950",
                savedCount > 0 &&
                  variant !== "overlay" &&
                  "bg-amber-500/85 hover:bg-amber-500 border-amber-400 text-amber-950",
              )}
              title={
                savedCount > 0
                  ? `Guardada en ${savedCount} colección(es)`
                  : "Guardar en colección"
              }
              aria-label="Guardar en colección"
            >
              <Bookmark className={iconClass} />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-0.5 rounded-full bg-amber-500 text-amber-950 text-[9px] font-bold flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {savedCount > 0
                  ? `Guardada en ${savedCount} colección(es)`
                  : "Guardar en…"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Nueva
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto pr-1 space-y-0.5">
              {loadingCols ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : collections.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                  No tienes colecciones.
                  <br />
                  Crea la primera arriba.
                </p>
              ) : (
                collections.map((c) => {
                  const saved = savedIn.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleSave(c.id)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors",
                        saved && "bg-amber-500/15 text-amber-200",
                      )}
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-amber-300/80 shrink-0" />
                      <span className="flex-1 truncate">{c.name}</span>
                      {saved && (
                        <span className="flex items-center gap-0.5 text-emerald-400 shrink-0">
                          <Check className="h-3 w-3" />
                          Guardada
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Compartir */}
        <Popover open={shareOpen} onOpenChange={setShareOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className={btnClass}
              title="Compartir"
              aria-label="Compartir"
            >
              <Share2 className={iconClass} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Compartir en…
            </div>
            <div className="space-y-0.5">
              <ShareItem
                icon={<Send className="h-3.5 w-3.5 text-emerald-400" />}
                label="WhatsApp"
                onClick={() => shareTo("whatsapp")}
              />
              <ShareItem
                icon={<Send className="h-3.5 w-3.5 text-sky-400" />}
                label="Telegram"
                onClick={() => shareTo("telegram")}
              />
              <ShareItem
                icon={<Twitter className="h-3.5 w-3.5" />}
                label="X (Twitter)"
                onClick={() => shareTo("twitter")}
              />
              <ShareItem
                icon={<Facebook className="h-3.5 w-3.5 text-blue-500" />}
                label="Facebook"
                onClick={() => shareTo("facebook")}
              />
              <button
                type="button"
                onClick={copyLink}
                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                {copied ? "¡Copiado!" : "Copiar enlace"}
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Descargar */}
        <Button
          size="icon"
          variant="secondary"
          className={btnClass}
          onClick={download}
          disabled={downloading}
          title="Descargar foto"
          aria-label="Descargar"
        >
          {downloading ? (
            <Loader2 className={cn(iconClass, "animate-spin")} />
          ) : (
            <Download className={iconClass} />
          )}
        </Button>
      </div>

      {/* Dialog crear colección */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva colección</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-col-name">Nombre *</Label>
            <Input
              id="new-col-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Mejores retratos 2024"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") createCollection();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={createCollection}
              disabled={creating || !newName.trim()}
              className="bg-amber-500 text-amber-950 hover:bg-amber-400 border-0"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Crear y añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShareItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}
