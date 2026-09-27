import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionAdmin } from '@/lib/auth'

// GET /api/photos/[id] — detalle de una foto + relacionadas
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const photo = await db.photo.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      inCollections: { include: { collection: true } },
    },
  })
  if (!photo) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  // Incrementar views (fire-and-forget, no bloquear respuesta)
  db.photo.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})

  // Relacionadas: misma categoría o tag compartido, excluir la actual, limit 8
  const tagIds = photo.tags.map((t) => t.tagId)
  const related = await db.photo.findMany({
    where: {
      id: { not: photo.id },
      OR: [
        ...(photo.category ? [{ category: photo.category }] : []),
        ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    take: 8,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    id: photo.id,
    src: photo.src,
    thumb: photo.thumb || photo.src,
    width: photo.width,
    height: photo.height,
    title: photo.title,
    description: photo.description,
    date: photo.date,
    location: photo.location,
    category: photo.category,
    source: photo.source,
    sourceUrl: photo.sourceUrl,
    views: photo.views + 1,  // reflejamos el incremento local
    pinned: photo.pinned,
    tags: photo.tags.map((t) => t.tag.name),
    collections: photo.inCollections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
    })),
    related: related.map((r) => ({
      id: r.id,
      src: r.src,
      thumb: r.thumb || r.src,
      title: r.title,
      category: r.category,
    })),
  })
}

// DELETE /api/photos/[id] — borrar (requiere admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSessionAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  await db.photo.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ ok: true })
}

// PATCH /api/photos/[id] — editar (requiere admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSessionAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const { tags, ...data } = body || {}

  // Si vienen tags, reemplazar
  if (Array.isArray(tags)) {
    await db.tagOnPhoto.deleteMany({ where: { photoId: id } })
    for (const t of tags) {
      const name = String(t).trim().toLowerCase()
      if (!name) continue
      const tag = await db.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
      await db.tagOnPhoto.create({ data: { photoId: id, tagId: tag.id } })
    }
  }

  const updated = await db.photo.update({
    where: { id },
    data: {
      ...(data.src !== undefined ? { src: data.src } : {}),
      ...(data.thumb !== undefined ? { thumb: data.thumb } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.date !== undefined ? { date: data.date ? new Date(data.date) : null } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.source !== undefined ? { source: data.source } : {}),
      ...(data.sourceUrl !== undefined ? { sourceUrl: data.sourceUrl } : {}),
      ...(data.pinned !== undefined ? { pinned: !!data.pinned } : {}),
    },
  })

  return NextResponse.json({ ok: true, id: updated.id })
}
