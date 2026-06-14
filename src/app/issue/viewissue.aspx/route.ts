import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { originFor, parseLegacyId, resolveIssueTarget } from "@/lib/legacy-redirects";

export const dynamic = "force-dynamic";

// Legacy: /issue/viewissue.aspx?id={oldId} -> /issues/{slug}.
// No id (the old "current issue" link) or an unknown id -> the issues index.
export async function GET(request: NextRequest) {
  const origin = originFor(request);
  const id = parseLegacyId(request.nextUrl.searchParams.get("id"));
  const target = id ? await resolveIssueTarget(id) : null;
  return NextResponse.redirect(new URL(target ?? "/issues", origin), 301);
}
