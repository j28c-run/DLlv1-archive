"use client";

import { useState, useRef, useCallback } from "react";
import {
  Loader2,
  Link2,
  Upload,
  ListChecks,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Filters } from "@/lib/types";

type ResultItem = {
  id: string;
  src: string;
  title?: string | null;
  category?: string | null;
  source: string;
  width?: number | null;
  height?: number | null;
  tags: string[];
};
type ResultFail = { url?: string; name?: string; error: string };

type Props = {
  filters: Filters | null;
  onDone: () => void;
};

export function BulkUpload({ filters, onDone }: Props) {
  const [mode, setMode] = useState<"urls" | "files">("urls");
  const [urls, setUrls] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [defaultsCategory, setDefaultsCategory] = useState("");
  const [defaultsSource, setDefaultsSource] = useState("");
  const [defaultsTags, setDefaultsTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    created: ResultItem[];
    failed: ResultFail[];
    aiUsed: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const urlList = urls.split(/[\n,]/).map((u) => u.trim()).filter(Boolean);
  const totalPending = mode === "urls" ? urlList.length : files.length;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const submit = async () => {
    if (totalPending === 0) return;
    setLoading(true);
    setResults(null);
    try {
      const defaults = {
        ...(defaultsCategory ? { category: defaultsCategory } : {}),
        ...(defaultsSource ? { source: defaultsSource } : {}),
        ...(defaultsTags
          ? { tags: defaultsTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) }
          : {}),
      };
      let res: Response;
      if (mode === "urls") {
        res = await fetch("/api/photos/bulk-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: urlList, defaults, autoAnalyze }),
        });
      } else {
        const form = new FormData();
        for (const f of files) form.append("files", f);
        form.set("autoAnalyze", String(autoAnalyze));
        form.set("defaults", JSON.stringify(defaults));
        res = await fetch("/api/photos/upload", { method: "POST", body: form });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en la subida");
      setResults({
        created: data.items || [],
        failed: data.failedItems || [],
        aiUsed: data.aiUsed || false,
      });
      if ((data.items || []).length > 0) {
        onDone();
        if (mode === "urls") setUrls("");
        if (mode === "files") setFiles([]);
      }
    } catch (e: any) {
      setResults({ created: [], failed: [{ error: e.message || "Error desconocido" }], aiUsed: false });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setUrls("");
    setFiles([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ModeButton active={mode === "urls"} onClick={() => setMode("urls")} icon={<Link2 className="h-4 w-4" />} label="Por URLs" />
        <ModeButton active={mode === "files"} onClick={() => setMode("files")} icon={<Upload className="h-4 w-4" />} label="Subir archivos" />
        <div className="ml-auto text-xs text-muted-foreground">
          {totalPending > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-200 px-2 py-0.5">
              <ListChecks className="h-3 w-3" />
              {totalPending} listas
            </span>
          )}
        </div>
      </div>

      {mode === "urls" ? (
        <div className="space-y-2">
          <Label htmlFor="urls">Pega URLs de imágenes (una por línea o separadas por coma)</Label>
          <Textarea
            id="urls"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={`https://instagram.com/...\nhttps://t.me/...\nhttps://i.pinimg.com/...`}
            rows={7}
            className="font-mono text-xs bg-background/60"
          />
          <p className="text-xs text-muted-foreground">
            La fuente (Instagram/Telegram/Patreon/local) se detecta automáticamente según la URL.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Arrastra imágenes aquí o haz clic para seleccionar</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
              dragOver ? "border-amber-500 bg-amber-500/5" : "border-border/60 hover:border-amber-500/40 bg-background/40",
            )}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">
              {files.length > 0 ? `${files.length} archivo(s) seleccionado(s)` : "Suelta tus imágenes aquí o haz clic"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF · hasta 50 a la vez</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const fs = Array.from(e.target.files || []);
                setFiles((prev) => [...prev, ...fs]);
                e.target.value = "";
              }}
            />
          </div>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <Badge key={i} variant="secondary" className="bg-background/60 border-border/60 gap-1">
                  <span className="truncate max-w-[140px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, idx) => idx !== i)); }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Quitar"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="flex items-center justify-between sm:col-span-3">
          <div>
            <Label htmlFor="auto" className="cursor-pointer">Auto-análisis con IA</Label>
            <p className="text-xs text-muted-foreground">
              Detecta automáticamente: título, descripción, categoría y etiquetas. Se desactiva para lotes &gt;25.
            </p>
          </div>
          <Switch id="auto" checked={autoAnalyze} onCheckedChange={setAutoAnalyze} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat">Categoría (default)</Label>
          <Input id="cat" value={defaultsCategory} onChange={(e) => setDefaultsCategory(e.target.value)} placeholder="Auto-detectada" list="bulk-cats" className="bg-background/60" />
          <datalist id="bulk-cats">
            {filters?.categories.map((c) => (<option key={c} value={c} />))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="src">Fuente (default)</Label>
          <Select value={defaultsSource} onValueChange={setDefaultsSource}>
            <SelectTrigger id="src" className="bg-background/60"><SelectValue placeholder="Auto-detectada" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Subida local</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="patreon">Patreon</SelectItem>
              <SelectItem value="other">Otra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags extra (coma)</Label>
          <Input id="tags" value={defaultsTags} onChange={(e) => setDefaultsTags(e.target.value)} placeholder="archivo, 2024, douhal" className="bg-background/60" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={loading || totalPending === 0} className="bg-amber-500 text-amber-950 hover:bg-amber-400 border-0">
          {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
          Subir {totalPending > 0 && `(${totalPending})`}
        </Button>
        {totalPending > 0 && !loading && (
          <Button variant="ghost" onClick={reset}>Limpiar</Button>
        )}
      </div>

      {results && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold">{results.created.length}</span> subidas
            </div>
            {results.failed.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="font-semibold">{results.failed.length}</span> fallidas
              </div>
            )}
            {results.aiUsed ? (
              <Badge className="bg-amber-500/15 text-amber-200 border-amber-500/30">
                <Sparkles className="h-3 w-3 mr-1" />IA activa
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-background/60">Sin IA (lote grande)</Badge>
            )}
          </div>

          {results.created.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {results.created.map((r) => (
                <div key={r.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted/40 border border-border/50">
                  <img src={r.src} alt={r.title || "Foto subida"} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-white text-[10px]">
                    {r.title && <p className="line-clamp-2 leading-tight">{r.title}</p>}
                    {r.category && (
                      <Badge className="mt-1 bg-amber-500/80 text-amber-950 border-0 text-[9px] px-1 py-0">{r.category}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.failed.length > 0 && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                <AlertCircle className="h-3.5 w-3.5" />Errores:
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {results.failed.map((f, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <code className="text-amber-200">{f.url || f.name || "—"}</code>: {f.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all border",
        active
          ? "bg-amber-500 text-amber-950 border-amber-400"
          : "bg-background/40 text-muted-foreground border-border/60 hover:border-amber-500/40 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
