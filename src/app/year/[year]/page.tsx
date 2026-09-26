"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Navbar } from "@/components/gallery/Navbar";
import { Sidebar } from "@/components/gallery/Sidebar";
import { PhotoCard } from "@/components/gallery/PhotoCard";
import { Button } from "@/components/ui/button";
import { useInfinite } from "@/hooks/use-infinite";
import type { Photo } from "@/lib/types";

export default function YearPage() {
  const { year } = useParams<{ year: string }>();
  const [count, setCount] = useState<number | null>(null);

  const fetcher = async (cursor: string | null) => {
    const params = new URLSearchParams({
      limit: "30", sort: "recent", year, category: "Todas", source: "Todas",
    });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/photos?${params}`);
    if (!res.ok) throw new Error("Error");
    return res.json();
  };

  const { data, loading, hasMore, loadMoreRef } = useInfinite<Photo>(fetcher, [year]);

  useEffect(() => {
    fetch(`/api/photos?limit=1&year=${year}&category=Todas&source=Todas&sort=recent`)
      .then((r) => r.json())
      .then((d) => setCount(d.total || 0))
      .catch(() => {});
  }, [year]);

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Sidebar open={false} onClose={() => {}} />
      <div className="lg:pl-72">
        <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-4 lg:px-6 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-3 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fotos de {year}</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {count !== null ? `${count} foto(s) de este año` : "Cargando…"}
          </p>

          {data.length === 0 && !loading ? (
            <div className="text-center py-20 text-sm text-muted-foreground">No hay fotos de este año.</div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3">
              {data.map((p, idx) => (<PhotoCard key={p.id} photo={p} index={idx} />))}
            </div>
          )}

          <div ref={loadMoreRef} className="py-6 flex items-center justify-center">
            {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {!loading && !hasMore && data.length > 0 && (
              <span className="text-xs text-muted-foreground">Fin</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
