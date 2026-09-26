import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";
import { analyzeImageWithAI, upsertTags } from "@/lib/image-analysis";

// POST /api/photos/[id]/analyze
// Body: { override?: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const override = !!body?.override;

  const photo = await db.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }
  const ai = await analyzeImageWithAI(photo.src);
  if (!ai) {
    return NextResponse.json(
      { error: "No se pudo analizar la imagen con IA" },
      { status: 500 },
    );
  }

  const newTitle = override || !photo.title ? ai.title : photo.title;
  const newDesc = override || !photo.description ? ai.description : photo.description;
  const newCat = override || !photo.category ? ai.category : photo.category;

  if (override) {
    await db.tagOnPhoto.deleteMany({ where: { photoId: id } });
  }
  const existingTags = await db.tagOnPhoto.findMany({
    where: { photoId: id },
    include: { tag: true },
  });
  const existingNames = new Set(existingTags.map((t) => t.tag.name));
  const newTags = ai.tags.filter((t) => !existingNames.has(t));
  const tagRecords = await upsertTags(newTags);

  await db.photo.update({
    where: { id },
    data: {
      title: newTitle,
      description: newDesc,
      category: newCat,
      tags: { create: tagRecords.map((t) => ({ tagId: t.tagId })) },
    },
  });

  return NextResponse.json({
    ok: true,
    title: newTitle,
    description: newDesc,
    category: newCat,
    newTagsAdded: newTags.length,
  });
}
