import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import JSZip from "jszip";

// GET /api/collections/[id]/download
// Descarga todas las fotos de la colección en un archivo .zip
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const col = await db.collection.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { addedAt: "asc" },
        include: { photo: true },
      },
    },
  });

  if (!col) {
    return NextResponse.json({ error: "Colección no encontrada" }, { status: 404 });
  }

  if (col.photos.length === 0) {
    return NextResponse.json(
      { error: "La colección está vacía" },
      { status: 400 },
    );
  }

  const fs = await import("fs/promises");
  const path = await import("path");

  const zip = new JSZip();
  const folder = zip.folder(sanitizeFilename(col.name)) || zip;

  let added = 0;
  const errors: string[] = [];

  for (let i = 0; i < col.photos.length; i++) {
    const p = col.photos[i].photo;
    try {
      let buffer: Buffer;
      let ext: string;

      if (p.src.startsWith("/")) {
        const filePath = path.join(process.cwd(), "public", p.src);
        buffer = await fs.readFile(filePath);
        ext = path.extname(p.src).toLowerCase() || ".jpg";
      } else {
        const res = await fetch(p.src);
        if (!res.ok) {
          errors.push(`No se pudo descargar ${p.id}`);
          continue;
        }
        buffer = Buffer.from(await res.arrayBuffer());
        const ct = res.headers.get("content-type") || "image/jpeg";
        ext = ct.includes("png")
          ? ".png"
          : ct.includes("webp")
            ? ".webp"
            : ct.includes("gif")
              ? ".gif"
              : ".jpg";
      }

      // Nombre: 001_titulo.jpg (con índice para mantener orden)
      const safeTitle = sanitizeFilename(p.title || "foto");
      const num = String(i + 1).padStart(3, "0");
      folder.file(`${num}_${safeTitle}${ext}`, buffer);
      added++;
    } catch (e) {
      errors.push(`Error con ${p.id}`);
    }
  }

  if (added === 0) {
    return NextResponse.json(
      { error: "No se pudo descargar ninguna foto" },
      { status: 500 },
    );
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const zipName = sanitizeFilename(col.name);

  return new NextResponse(zipBuffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}.zip"`,
      "Content-Length": String(zipBuffer.length),
      "Cache-Control": "no-cache",
    },
  });
}

function sanitizeFilename(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60) || "coleccion";
}
