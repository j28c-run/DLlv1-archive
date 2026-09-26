// Autodetección de metadata de imágenes para subida masiva.

import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

// 1) Autodetección de FUENTE desde la URL
export function detectSource(url: string): {
  source: string;
  sourceUrl?: string;
} {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (
      host.includes("instagram") ||
      host.includes("cdninstagram") ||
      host.includes("fbcdn")
    ) {
      return { source: "instagram", sourceUrl: u.href };
    }
    if (host.includes("t.me") || host.includes("telegram") || host.includes("tgraph")) {
      return { source: "telegram", sourceUrl: u.href };
    }
    if (host.includes("patreon") || host.includes("pcdn.co")) {
      return { source: "patreon", sourceUrl: u.href };
    }
    return { source: "local", sourceUrl: u.href };
  } catch {
    return { source: "local" };
  }
}

// 2) Autodetección de DIMENSIONES (descargando binario y parseando header)
export async function detectDimensions(
  url: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return detectDimensionsBuffer(buf);
  } catch {
    return null;
  }
}

export function detectDimensionsBuffer(buf: Buffer): {
  width: number;
  height: number;
} | null {
  try {
    if (buf.length < 24) return null;
    // PNG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    // JPEG
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = buf[i + 1];
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          return {
            height: buf.readUInt16BE(i + 5),
            width: buf.readUInt16BE(i + 7),
          };
        }
        const segLen = buf.readUInt16BE(i + 2);
        i += 2 + segLen;
      }
      return null;
    }
    // GIF
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    // WebP
    if (
      buf.slice(0, 4).toString("ascii") === "RIFF" &&
      buf.slice(8, 12).toString("ascii") === "WEBP"
    ) {
      const chunkType = buf.slice(12, 16).toString("ascii");
      if (chunkType === "VP8 ") {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
      if (chunkType === "VP8L") {
        const b0 = buf[21];
        const b1 = buf[22];
        const b2 = buf[23];
        const b3 = buf[24];
        return {
          width: 1 + (((b1 & 0x3f) << 8) | b0),
          height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
        };
      }
      if (chunkType === "VP8X") {
        return {
          width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
          height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// 3) Auto-categorización + título + descripción + tags con VLM (IA)
const CATEGORIES = [
  "Retratos",
  "Looks",
  "Live",
  "Behind",
  "Fans",
  "Eventos",
  "Viajes",
  "Estilo",
] as const;

type AnalyzedMeta = {
  title: string;
  description: string;
  category: string;
  tags: string[];
};

let zaiSingleton: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!zaiSingleton) zaiSingleton = await ZAI.create();
  return zaiSingleton;
}

export async function analyzeImageWithAI(
  imageUrl: string,
): Promise<AnalyzedMeta | null> {
  try {
    const zai = await getZai();
    const prompt = `Eres un archivador visual de un fan page de Douha Laribi (creadora marroquí de contenido, conocida por looks con hijab y moda modesta).
Analiza esta foto y responde SOLO en JSON válido con esta estructura exacta, sin texto adicional ni markdown:

{
  "title": "título corto y descriptivo en español, máximo 50 caracteres",
  "description": "descripción breve en español, 1-2 frases, máximo 140 caracteres",
  "category": "una de estas: ${CATEGORIES.join(" | ")}",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Reglas:
- Elige la categoría que mejor encaje (Retratos = primer plano/estudio; Looks = outfit/moda; Live = screenshot de live/stream; Behind = backstage/detrás cámaras; Fans = con seguidores; Eventos = gala/alfombra/festival; Viajes = paisaje/ubicación; Estilo = detalle de accesorio/textura).
- Tags en minúsculas, sin #, en español o términos universales (ej: "hijab", "dorador", "exterior", "retrato", "live", "noche").
- 3-5 tags máximo.
- Si la imagen no tiene contenido relevante, title="Imagen sin contexto".`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const content = response.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.category || !CATEGORIES.includes(parsed.category)) {
      parsed.category = "Retratos";
    }
    if (!Array.isArray(parsed.tags)) parsed.tags = [];
    parsed.tags = parsed.tags
      .filter((t: any) => typeof t === "string")
      .map((t: string) => t.toLowerCase().trim())
      .filter(Boolean)
      .slice(0, 6);

    return {
      title: String(parsed.title || "").slice(0, 120),
      description: String(parsed.description || "").slice(0, 280),
      category: parsed.category,
      tags: parsed.tags as string[],
    };
  } catch (e) {
    console.error("VLM analysis error:", e);
    return null;
  }
}

// 4) Helper: upsert de tags
export async function upsertTags(
  names: string[],
): Promise<{ tagId: string }[]> {
  const out: { tagId: string }[] = [];
  for (const name of names) {
    const clean = String(name).trim().toLowerCase();
    if (!clean) continue;
    const tag = await db.tag.upsert({
      where: { name: clean },
      update: {},
      create: { name: clean },
    });
    out.push({ tagId: tag.id });
  }
  return out;
}
