import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";
import {
  detectSource,
  detectDimensions,
  analyzeImageWithAI,
  upsertTags,
} from "@/lib/image-analysis";

// POST /api/photos/create
// Body: src, autoAnalyze (default true), overrides { title?, description?, category?, source?, sourceUrl?, date?, location?, tags?, pinned?, width?, height? }
export async function POST(req: NextRequest) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const {
    src,
    autoAnalyze = true,
    title,
    description,
    date,
    location,
    category,
    source,
    sourceUrl,
    tags = [],
    pinned = false,
    width,
    height,
  } = body || {};

  if (!src || typeof src !== "string") {
    return NextResponse.json({ error: "Falta la URL de la imagen (src)" }, { status: 400 });
  }

  let detectedSource = source;
  let detectedSourceUrl = sourceUrl;
  if (!detectedSource) {
    const det = detectSource(src);
    detectedSource = det.source;
    detectedSourceUrl = detectedSourceUrl || det.sourceUrl;
  }

  let detectedWidth = width ? Number(width) : null;
  let detectedHeight = height ? Number(height) : null;
  if ((!detectedWidth || !detectedHeight) && autoAnalyze) {
    const dims = await detectDimensions(src);
    if (dims) {
      if (!detectedWidth) detectedWidth = dims.width;
      if (!detectedHeight) detectedHeight = dims.height;
    }
  }

  let finalTitle = title || null;
  let finalDescription = description || null;
  let finalCategory = category || null;
  let finalTags = Array.isArray(tags) ? tags : [];

  const needAI = autoAnalyze && (!finalTitle || !finalCategory || finalTags.length === 0);
  if (needAI) {
    const ai = await analyzeImageWithAI(src);
    if (ai) {
      if (!finalTitle) finalTitle = ai.title;
      if (!finalDescription) finalDescription = ai.description;
      if (!finalCategory) finalCategory = ai.category;
      if (finalTags.length === 0) finalTags = ai.tags;
    }
  }

  const tagRecords = await upsertTags(finalTags);
  const photo = await db.photo.create({
    data: {
      src,
      thumb: src,
      title: finalTitle,
      description: finalDescription,
      date: date ? new Date(date) : null,
      location: location || null,
      category: finalCategory,
      source: detectedSource || "local",
      sourceUrl: detectedSourceUrl || null,
      pinned: !!pinned,
      width: detectedWidth,
      height: detectedHeight,
      tags: { create: tagRecords.map((t) => ({ tagId: t.tagId })) },
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(
    {
      id: photo.id,
      src: photo.src,
      title: photo.title,
      category: photo.category,
      source: photo.source,
      width: photo.width,
      height: photo.height,
      tags: photo.tags.map((t) => t.tag.name),
    },
    { status: 201 },
  );
}
