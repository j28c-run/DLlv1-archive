import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [total, tags, categories, photos] = await Promise.all([
    db.photo.count(),
    db.tag.count(),
    db.photo.findMany({
      where: { NOT: { category: null } },
      distinct: ['category'],
      select: { category: true },
    }),
    db.photo.findMany({
      where: { NOT: { date: null } },
      select: { date: true },
    }),
  ])

  const years = Array.from(
    new Set(
      photos
        .map((p) => p.date?.toISOString().slice(0, 4))
        .filter(Boolean) as string[],
    ),
  )

  return NextResponse.json({
    total,
    tags,
    categories: categories.length,
    years: years.length,
  })
}
