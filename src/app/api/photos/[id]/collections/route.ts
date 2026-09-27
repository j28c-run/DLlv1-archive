import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/photos/[id]/collections
// Devuelve en qué colecciones está la foto (público, sin auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photo = await db.photo.findUnique({
    where: { id },
    select: {
      inCollections: {
        include: { collection: true },
      },
    },
  });
  if (!photo) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json({
    collections: photo.inCollections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
    })),
  });
}
