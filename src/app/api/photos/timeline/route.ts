import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/photos/timeline — agrupación por año y mes
export async function GET() {
  const photos = await db.photo.findMany({
    where: { NOT: { date: null } },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  const tree: Record<string, Record<string, number>> = {};
  for (const p of photos) {
    if (!p.date) continue;
    const d = new Date(p.date);
    const y = String(d.getUTCFullYear());
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    if (!tree[y]) tree[y] = {};
    tree[y][m] = (tree[y][m] || 0) + 1;
  }
  const years = Object.entries(tree)
    .map(([year, months]) => ({
      year,
      total: Object.values(months).reduce((a, b) => a + b, 0),
      months: Object.entries(months)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => Number(b.month) - Number(a.month)),
    }))
    .sort((a, b) => Number(b.year) - Number(a.year));
  return NextResponse.json({ years });
}
