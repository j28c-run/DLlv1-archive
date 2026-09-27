import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";

// POST /api/collections/[id]/photos — añadir foto(s) a colección (admin)
// Body: { photoId } o { photoIds: [] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const photoIds: string[] = body.photoIds || (body.photoId ? [body.photoId] : []);
  if (photoIds.length === 0) {
    return NextResponse.json({ error: "Falta photoId" }, { status: 400 });
  }
  // Crear relaciones (ignorar si ya existen manualmente)
  let added = 0;
  for (const pid of photoIds) {
    try {
      await db.collectionPhoto.create({
        data: { collectionId: id, photoId: pid },
      });
      added++;
    } catch {
      // Ya existe (P2002 unique constraint) — ignorar
    }
  }
  return NextResponse.json({ ok: true, added });
}

// DELETE /api/collections/[id]/photos?photoId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) {
    return NextResponse.json({ error: "Falta photoId" }, { status: 400 });
  }
  await db.collectionPhoto.delete({
    where: { collectionId_photoId: { collectionId: id, photoId } },
  });
  return NextResponse.json({ ok: true });
}
