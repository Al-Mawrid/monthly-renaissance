import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { originFor, parseLegacyId, resolveContentTarget } from "@/lib/legacy-redirects";

export const dynamic = "force-dynamic";

// Root-level alias for the legacy article URL. The canonical legacy path is
// /issue/content.aspx (see src/app/issue/content.aspx/route.ts); this keeps any
// inbound links that dropped the /issue/ prefix working too.
export async function GET(request: NextRequest) {
  const origin = originFor(request);
  const id = parseLegacyId(request.nextUrl.searchParams.get("id"));
  const target = id ? await resolveContentTarget(id) : null;
  return NextResponse.redirect(new URL(target ?? "/", origin), 301);
}
