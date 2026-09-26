import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/photos — paginación cursor-based + búsqueda avanzada combinada
// Params: limit, cursor, q, category, source, year, tag (multi-coma), tagMode (any|all), sort, pinned
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 30), 60);
  const cursor = searchParams.get("cursor") || undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const category = searchParams.get("category") || undefined;
  const source = searchParams.get("source") || undefined;
  const year = searchParams.get("year") || undefined;
  const tagParam = searchParams.get("tag") || undefined;
  const tagMode = (searchParams.get("tagMode") || "any") as "any" | "all";
  const sort = searchParams.get("sort") || "recent";
  const pinnedParam = searchParams.get("pinned");

  const tags = tagParam
    ? tagParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const where: any = { AND: [] };
  if (q) {
    where.AND.push({
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
      ],
    });
  }
  if (category && category !== "Todas") where.AND.push({ category });
  if (source && source !== "Todas") where.AND.push({ source });
  if (year && year !== "Todos") {
    const start = new Date(`${year}-01-01T00:00:00Z`);
    const end = new Date(`${Number(year) + 1}-01-01T00:00:00Z`);
    where.AND.push({ date: { gte: start, lt: end } });
  }
  if (tags.length > 0) {
    if (tagMode === "all") {
      where.AND.push(
        ...tags.map((name) => ({
          tags: { some: { tag: { name } } },
        })),
      );
    } else {
      where.AND.push({
        tags: { some: { tag: { name: { in: tags } } } },
      });
    }
  }
  if (pinnedParam === "true") where.AND.push({ pinned: true });
  if (pinnedParam === "false") where.AND.push({ pinned: false });
  if (where.AND.length === 0) delete where.AND;

  let orderBy: any[];
  if (sort === "popular") {
    orderBy = [{ pinned: "desc" }, { views: "desc" }, { createdAt: "desc" }];
  } else if (sort === "oldest") {
    orderBy = [
      { pinned: "desc" },
      { date: { sort: "asc", nulls: "last" as const } },
      { createdAt: "asc" },
    ];
  } else {
    orderBy = [{ pinned: "desc" }, { createdAt: "desc" }];
  }

  const photos = await db.photo.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { tags: { include: { tag: true } } },
  });

  const hasMore = photos.length > limit;
  const items = hasMore ? photos.slice(0, limit) : photos;
  const nextCursor = hasMore ? items[items.length - 1].id : null;
  const total = await db.photo.count({ where });

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
      sourceUrl: p.sourceUrl,
      views: p.views,
      pinned: p.pinned,
      tags: p.tags.map((t) => t.tag.name),
    })),
    nextCursor,
    hasMore,
    total,
  });
}
