import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseLegacyId, resolveContentTarget } from "@/lib/legacy-redirects";

export const dynamic = "force-dynamic";

// Legacy: /issue/content.aspx?id={oldId} -> article / Q&A / ebook detail.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const id = parseLegacyId(request.nextUrl.searchParams.get("id"));
  const target = id ? await resolveContentTarget(id) : null;
  return NextResponse.redirect(new URL(target ?? "/", origin), 301);
}
