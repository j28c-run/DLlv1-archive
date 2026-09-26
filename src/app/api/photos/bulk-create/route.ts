import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";
import {
  detectSource,
  detectDimensions,
  analyzeImageWithAI,
  upsertTags,
} from "@/lib/image-analysis";

// POST /api/photos/bulk-create
// Body: { urls: string[], defaults?: { source?, category?, tags?, pinned? }, autoAnalyze?: boolean }
export async function POST(req: NextRequest) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const { urls, defaults = {}, autoAnalyze = true } = body || {};
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "Se requiere array `urls`" }, { status: 400 });
  }
  if (urls.length > 200) {
    return NextResponse.json({ error: "Máximo 200 URLs por lote" }, { status: 400 });
  }

  const useAI = autoAnalyze && urls.length <= 25;
  const created: any[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  for (const rawUrl of urls) {
    const url = String(rawUrl || "").trim();
    if (!url) {
      failed.push({ url: "", error: "URL vacía" });
      continue;
    }
    try {
      const det = detectSource(url);
      const source = defaults.source || det.source;
      const sourceUrl = defaults.sourceUrl || det.sourceUrl;

      let width: number | null = null;
      let height: number | null = null;
      if (autoAnalyze) {
        const dims = await detectDimensions(url);
        if (dims) {
          width = dims.width;
          height = dims.height;
        }
      }

      let title: string | null = null;
      let description: string | null = null;
      let category: string | null = defaults.category || null;
      let tagsList: string[] = Array.isArray(defaults.tags) ? defaults.tags : [];

      if (useAI) {
        const ai = await analyzeImageWithAI(url);
        if (ai) {
          title = ai.title;
          description = ai.description;
          if (!category) category = ai.category;
          if (tagsList.length === 0) tagsList = ai.tags;
        }
      }

      const tagRecords = await upsertTags(tagsList);
      const photo = await db.photo.create({
        data: {
          src: url,
          thumb: url,
          title,
          description,
          date: null,
          location: null,
          category,
          source,
          sourceUrl,
          pinned: !!defaults.pinned,
          width,
          height,
          tags: { create: tagRecords.map((t) => ({ tagId: t.tagId })) },
        },
        include: { tags: { include: { tag: true } } },
      });

      created.push({
        id: photo.id,
        src: photo.src,
        title: photo.title,
        category: photo.category,
        source: photo.source,
        width: photo.width,
        height: photo.height,
        tags: photo.tags.map((t) => t.tag.name),
      });
    } catch (e: any) {
      failed.push({ url, error: e?.message || "Error desconocido" });
    }
  }

  return NextResponse.json({
    created: created.length,
    failed: failed.length,
    items: created,
    failedItems: failed,
    aiUsed: useAI,
  });
}
