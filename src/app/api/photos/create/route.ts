import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionAdmin } from '@/lib/auth'

// POST /api/photos/create — crear foto (requiere admin)
// Body: { src, thumb?, title?, description?, date?, location?, category?, source?, sourceUrl?, tags?: string[], pinned? }
export async function POST(req: NextRequest) {
  const admin = await getSessionAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const {
    src,
    thumb,
    title,
    description,
    date,
    location,
    category,
    source = 'local',
    sourceUrl,
    tags = [],
    pinned = false,
    width,
    height,
  } = body || {}

  if (!src || typeof src !== 'string') {
    return NextResponse.json({ error: 'Falta la URL de la imagen (src)' }, { status: 400 })
  }

  // Upsert de tags
  const tagRecords: { tagId: string }[] = []
  for (const t of (tags as string[])) {
    const name = String(t).trim().toLowerCase()
    if (!name) continue
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    tagRecords.push({ tagId: tag.id })
  }

  const photo = await db.photo.create({
    data: {
      src,
      thumb: thumb || null,
      title: title || null,
      description: description || null,
      date: date ? new Date(date) : null,
      location: location || null,
      category: category || null,
      source,
      sourceUrl: sourceUrl || null,
      pinned: !!pinned,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      tags: { create: tagRecords.map((t) => ({ tagId: t.tagId })) },
    },
    include: { tags: { include: { tag: true } } },
  })

  return NextResponse.json({
    id: photo.id,
    src: photo.src,
    thumb: photo.thumb,
    title: photo.title,
    tags: photo.tags.map((t) => t.tag.name),
  }, { status: 201 })
}
