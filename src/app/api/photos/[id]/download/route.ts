import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/photos/[id]/download
// Descarga la imagen con Content-Disposition: attachment (fuerza la descarga en el navegador)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photo = await db.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  try {
    // Si la foto es local (/uploads/...), leer el archivo directamente
    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (photo.src.startsWith("/")) {
      const fs = await import("fs/promises");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "public", photo.src);
      buffer = await fs.readFile(filePath);
      const ext = path.extname(photo.src).toLowerCase();
      contentType =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "image/jpeg";
      filename = `douhal-${id}${ext}`;
    } else {
      // URL remota: descargar con fetch
      const res = await fetch(photo.src);
      if (!res.ok) {
        return NextResponse.json(
          { error: "No se pudo descargar la imagen fuente" },
          { status: 502 },
        );
      }
      buffer = Buffer.from(await res.arrayBuffer());
      contentType = res.headers.get("content-type") || "image/jpeg";
      const ext =
        contentType.includes("png")
          ? ".png"
          : contentType.includes("webp")
            ? ".webp"
            : contentType.includes("gif")
              ? ".gif"
              : ".jpg";
      filename = `douhal-${id}${ext}`;
    }

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error al descargar" },
      { status: 500 },
    );
  }
}
