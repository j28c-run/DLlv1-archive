"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Loader2, ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/gallery/Navbar";
import { Sidebar } from "@/components/gallery/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Collection = {
  id: string;
  name: string;
  description?: string | null;
  coverSrc?: string | null;
  photoCount: number;
};

export default function CollectionsPage() {
  const [items, setItems] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetch("/api/collections?withCover=1")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.authenticated))
      .catch(() => {});
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error");
      }
      toast({ title: "Colección creada", description: name });
      setName("");
      setDescription("");
      setCreateOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Sidebar open={false} onClose={() => {}} />
      <div className="lg:pl-72">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver
            </Link>
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Colecciones</h1>
              <p className="text-sm text-muted-foreground mt-1">Tableros temáticos para organizar tus fotos favoritas</p>
            </div>
            {isAdmin && (
              <Button onClick={() => setCreateOpen(true)} className="bg-amber-500 text-amber-950 hover:bg-amber-400 border-0">
                <Plus className="h-4 w-4 mr-1.5" />
                Nueva
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                <FolderOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Aún no hay colecciones</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {isAdmin
                  ? "Crea tu primera colección para empezar a organizar fotos por tema (ej: 'Gira 2024', 'Mejores retratos', 'Casablanca')."
                  : "Las colecciones son tableros temáticos creados por el administrador. Vuelve pronto."}
              </p>
              {isAdmin && (
                <Button onClick={() => setCreateOpen(true)} className="bg-amber-500 text-amber-950 hover:bg-amber-400 border-0">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Crear primera colección
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                >
                  <Link
                    href={`/collections/${c.id}`}
                    className="group block rounded-xl overflow-hidden border border-border/60 bg-card hover:border-amber-500/40 transition-colors"
                  >
                    <div className="aspect-square bg-muted/40 relative overflow-hidden">
                      {c.coverSrc ? (
                        <Image
                          src={c.coverSrc}
                          alt={c.name}
                          fill
                          sizes="300px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80" />
                      <div className="absolute bottom-0 inset-x-0 p-3 text-white">
                        <p className="font-semibold text-sm line-clamp-2">{c.name}</p>
                        <p className="text-[11px] text-white/70">{c.photoCount} foto(s)</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!isAdmin && (
            <div className="mt-10 rounded-xl border border-border/60 bg-card/40 p-4 flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Solo el administrador puede crear colecciones. Si eres tú,{" "}
                <Link href="/login" className="text-amber-200 hover:underline">inicia sesión</Link>.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva colección</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Gira 2024, Mejores retratos, Casablanca…"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Descripción (opcional)</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="¿De qué trata esta colección?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={create} disabled={creating || !name.trim()} className="bg-amber-500 text-amber-950 hover:bg-amber-400 border-0">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
