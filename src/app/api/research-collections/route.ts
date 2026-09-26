import { NextResponse } from "next/server";
import { getResearchCollection } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic")?.trim();
  if (!topic) return NextResponse.json({ error: "A topic is required." }, { status: 400 });

  const collection = await getResearchCollection(topic, {
    cursor: searchParams.get("cursor"),
    writer: searchParams.get("writer"),
    group: searchParams.get("group"),
  });
  if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  return NextResponse.json(collection);
}
