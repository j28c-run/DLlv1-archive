import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";

// GET /api/collections?withCover=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const withCover = searchParams.get("withCover") === "1";

  const collections = await db.collection.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: { select: { photos: true } },
      coverPhoto: true,
    },
    take: 100,
  });

  return NextResponse.json({
    items: collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      coverSrc:
        withCover && c.coverPhoto ? c.coverPhoto.thumb || c.coverPhoto.src : null,
      photoCount: c._count.photos,
      createdAt: c.createdAt,
    })),
  });
}

// POST /api/collections — crear (admin)
export async function POST(req: NextRequest) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { name, description, coverPhotoId } = body || {};
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }
  const col = await db.collection.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      coverPhotoId: coverPhotoId || null,
    },
  });
  return NextResponse.json({ id: col.id, name: col.name }, { status: 201 });
}
