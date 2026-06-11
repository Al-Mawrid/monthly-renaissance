import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Legacy: /issue/archives.aspx -> the issues index.
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/issues", request.nextUrl.origin), 301);
}
