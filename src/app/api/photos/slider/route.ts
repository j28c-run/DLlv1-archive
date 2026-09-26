import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/photos/slider?limit=8
// Devuelve fotos para el hero slider: prioriza destacadas, luego populares, luego recientes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 8), 20);

  // 1) Destacadas primero
  const pinned = await db.photo.findMany({
    where: { pinned: true },
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { tags: { include: { tag: true } } },
  });

  // 2) Completar con populares si faltan
  let items = pinned;
  if (items.length < limit) {
    const pinnedIds = new Set(pinned.map((p) => p.id));
    const extra = await db.photo.findMany({
      where: { id: { notIn: Array.from(pinnedIds) } },
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: limit - items.length,
      include: { tags: { include: { tag: true } } },
    });
    items = [...items, ...extra];
  }

  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      src: p.src,
      thumb: p.thumb || p.src,
      width: p.width,
      height: p.height,
      title: p.title,
      description: p.description,
      date: p.date,
      location: p.location,
      category: p.category,
      source: p.source,
      tags: p.tags.map((t) => t.tag.name),
      pinned: p.pinned,
    })),
  });
}
