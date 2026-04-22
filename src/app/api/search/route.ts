import { NextResponse } from "next/server";
import { searchAll } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limitParam = parseInt(searchParams.get("limit") ?? "5", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 5;
  const results = await searchAll(q, limit);
  return NextResponse.json(results);
}
