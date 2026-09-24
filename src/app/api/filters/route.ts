import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/filters — devuelve categorías, fuentes, años y tags disponibles
export async function GET() {
  const [categories, sources, photos, tags] = await Promise.all([
    db.photo.findMany({
      where: { NOT: { category: null } },
      distinct: ['category'],
      select: { category: true },
    }),
    db.photo.findMany({
      distinct: ['source'],
      select: { source: true },
    }),
    db.photo.findMany({
      where: { NOT: { date: null } },
      select: { date: true },
    }),
    db.tag.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, _count: { select: { photos: true } } },
    }),
  ])

  const years = Array.from(
    new Set(
      photos
        .map((p) => p.date?.toISOString().slice(0, 4))
        .filter(Boolean) as string[],
    ),
  ).sort((a, b) => Number(b) - Number(a))

  return NextResponse.json({
    categories: categories.map((c) => c.category).filter(Boolean).sort(),
    sources: sources.map((s) => s.source).filter(Boolean).sort(),
    years,
    tags: tags
      .filter((t) => t._count.photos > 0)
      .map((t) => ({ name: t.name, count: t._count.photos })),
    total: await db.photo.count(),
  })
}
