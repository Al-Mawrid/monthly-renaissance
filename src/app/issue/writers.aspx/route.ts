import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Legacy: /issue/writers.aspx?option=articles|queries -> writers index.
export function GET(request: NextRequest) {
  const option = request.nextUrl.searchParams.get("option");
  const target = option === "queries" ? "/queries/writers" : "/articles/writers";
  return NextResponse.redirect(new URL(target, request.nextUrl.origin), 301);
}
