import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/photos/random?limit=12
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 12), 30);
  const recent = await db.photo.findMany({
    orderBy: { createdAt: "desc" },
    take: limit * 4,
    include: { tags: { include: { tag: true } } },
  });
  const shuffled = recent
    .map((p) => ({ p, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, limit)
    .map((x) => x.p);

  return NextResponse.json({
    items: shuffled.map((p) => ({
      id: p.id,
      src: p.src,
      thumb: p.thumb || p.src,
      title: p.title,
      category: p.category,
      source: p.source,
      tags: p.tags.map((t) => t.tag.name),
    })),
  });
}
