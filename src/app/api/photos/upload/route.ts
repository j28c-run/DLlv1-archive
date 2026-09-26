import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionAdmin } from "@/lib/auth";
import {
  detectDimensionsBuffer,
  analyzeImageWithAI,
  upsertTags,
} from "@/lib/image-analysis";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// POST /api/photos/upload (multipart/form-data)
// files: File[], autoAnalyze (default true), defaults: JSON
export async function POST(req: NextRequest) {
  const admin = await getSessionAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const form = await req.formData();
  const files = form.getAll("files").filter((f) => f instanceof File) as File[];
  const autoAnalyze = form.get("autoAnalyze") !== "false";
  const defaultsRaw = (form.get("defaults") as string) || "{}";
  let defaults: any = {};
  try {
    defaults = JSON.parse(defaultsRaw);
  } catch {
    defaults = {};
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });
  }
  if (files.length > 50) {
    return NextResponse.json({ error: "Máximo 50 archivos por lote" }, { status: 400 });
  }

  const useAI = autoAnalyze && files.length <= 25;
  const created: any[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  const now = new Date();
  const monthDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const uploadsRoot = path.join(process.cwd(), "public", "uploads", "photos", monthDir);

  for (const file of files) {
    try {
      const extByMime: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      const ext = extByMime[file.type.toLowerCase()];
      if (!ext) {
        failed.push({ name: file.name, error: `Tipo no soportado: ${file.type}` });
        continue;
      }
      const randomName = crypto.randomBytes(10).toString("hex");
      const filename = `${randomName}.${ext}`;
      await mkdir(uploadsRoot, { recursive: true });
      const filePath = path.join(uploadsRoot, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      const publicUrl = `/uploads/photos/${monthDir}/${filename}`;

      let width: number | null = null;
      let height: number | null = null;
      if (autoAnalyze) {
        const dims = detectDimensionsBuffer(buffer);
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
        const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
        const ai = await analyzeImageWithAI(dataUrl);
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
          src: publicUrl,
          thumb: publicUrl,
          title,
          description,
          date: null,
          location: null,
          category,
          source: defaults.source || "local",
          sourceUrl: null,
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
      failed.push({ name: file.name, error: e?.message || "Error desconocido" });
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
