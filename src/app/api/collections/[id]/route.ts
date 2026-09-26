import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";

// GET /api/collections/[id] — detalle con fotos
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const col = await db.collection.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { createdAt: "desc" },
        include: { photo: { include: { tags: { include: { tag: true } } } } },
      },
      coverPhoto: true,
    },
  });
  if (!col) {
    return NextResponse.json({ error: "Colección no encontrada" }, { status: 404 });
  }
  return NextResponse.json({
    id: col.id,
    name: col.name,
    description: col.description,
    coverSrc: col.coverPhoto ? col.coverPhoto.thumb || col.coverPhoto.src : null,
    createdAt: col.createdAt,
    photos: col.photos.map((p) => ({
      id: p.photo.id,
      src: p.photo.src,
      thumb: p.photo.thumb || p.photo.src,
      width: p.photo.width,
      height: p.photo.height,
      title: p.photo.title,
      description: p.photo.description,
      date: p.photo.date,
      location: p.photo.location,
      category: p.photo.category,
      source: p.photo.source,
      sourceUrl: p.photo.sourceUrl,
      views: p.photo.views,
      pinned: p.photo.pinned,
      tags: p.photo.tags.map((t) => t.tag.name),
    })),
  });
}

// PATCH /api/collections/[id] — editar (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const updated = await db.collection.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.description !== undefined
        ? { description: body.description ? String(body.description).trim() : null }
        : {}),
      ...(body.coverPhotoId !== undefined
        ? { coverPhotoId: body.coverPhotoId || null }
        : {}),
    },
  });
  return NextResponse.json({ ok: true, id: updated.id });
}

// DELETE /api/collections/[id] — borrar (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  await db.collection.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
