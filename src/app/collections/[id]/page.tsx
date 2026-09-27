"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FolderOpen, Trash2, Download } from "lucide-react";
import { Navbar } from "@/components/gallery/Navbar";
import { Sidebar } from "@/components/gallery/Sidebar";
import { PhotoCard } from "@/components/gallery/PhotoCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Photo } from "@/lib/types";

type CollectionDetail = {
  id: string;
  name: string;
  description?: string | null;
  coverSrc?: string | null;
  photos: Photo[];
};

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [col, setCol] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/collections/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No encontrada");
        return r.json();
      })
      .then(setCol)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const downloadAll = async () => {
    if (!col || col.photos.length === 0) return;
    setZipping(true);
    try {
      const res = await fetch(`/api/collections/${id}/download`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al generar el ZIP");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") || "";
      const m = cd.match(/filename="([^"]+)"/);
      a.download = m?.[1] || "coleccion.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Descarga iniciada",
        description: `${col.photos.length} fotos en el ZIP`,
      });
    } catch (e: any) {
      toast({
        title: "Error al descargar",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setZipping(false);
    }
  };

  const removeCollection = async () => {
    if (!confirm(`¿Eliminar la colección "${col?.name}"? Las fotos no se borrarán.`)) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    router.push("/collections");
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Sidebar open={false} onClose={() => {}} />
      <div className="lg:pl-72">
        <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-4 lg:px-6 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
            <Link href="/collections">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Todas las colecciones
            </Link>
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !col ? (
            <div className="text-center py-20">
              <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Colección no encontrada</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{col.name}</h1>
                  {col.description && (
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{col.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{col.photos.length} foto(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={downloadAll}
                    disabled={zipping || col.photos.length === 0}
                    className="bg-amber-500 text-amber-950 hover:bg-amber-400 border-0"
                  >
                    {zipping ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-1.5" />
                    )}
                    {zipping ? "Generando ZIP…" : "Descargar todo (ZIP)"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={removeCollection} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Eliminar
                  </Button>
                </div>
              </div>

              {col.photos.length === 0 ? (
                <div className="text-center py-20 text-sm text-muted-foreground">
                  Esta colección está vacía. Añade fotos desde el panel admin.
                </div>
              ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3">
                  {col.photos.map((p, idx) => (
                    <PhotoCard key={p.id} photo={p} index={idx} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
