import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { detectBookMime } from "@/lib/uploads";
import { saveImageBuffer } from "@/lib/server/image-store";
import { convertDocxToHtml } from "@/lib/docx-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const MAX_BYTES = 25 * 1024 * 1024;

// Images extracted from the document are tagged with the same entityType the
// editor uses for manual image uploads, so they group consistently.
const ALLOWED_ENTITY_TYPES = new Set(["article", "query"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.role || !canEditContent(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 25 MB)" },
      { status: 413 },
    );
  }

  const nameExt = (file.name || "").split(".").pop()?.toLowerCase() ?? "";
  const claimedMime = (file.type || "").toLowerCase();
  if (claimedMime !== DOCX_MIME && nameExt !== "docx") {
    return NextResponse.json(
      { error: "Only Word .docx files are supported (legacy .doc is not)." },
      { status: 415 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // .docx is a ZIP container; confirm the magic bytes before handing it to the
  // parser so a renamed file fails fast with a clear message.
  if (detectBookMime(buf, DOCX_MIME) !== DOCX_MIME) {
    return NextResponse.json(
      { error: "File is not a valid .docx document." },
      { status: 415 },
    );
  }

  const entityTypeRaw = formData.get("entityType");
  const entityType =
    typeof entityTypeRaw === "string" && ALLOWED_ENTITY_TYPES.has(entityTypeRaw)
      ? entityTypeRaw
      : null;

  try {
    const { html, images, warnings } = await convertDocxToHtml(buf, {
      persistImage: (imgBuf, index) =>
        saveImageBuffer({
          buf: imgBuf,
          uploadedById: session.user.id,
          entityType,
          index,
        }).then((result) => result.url),
    });
    return NextResponse.json({ html, images, warnings });
  } catch (err) {
    console.error("[import-docx] conversion failed", err);
    return NextResponse.json(
      {
        error:
          "Could not read this Word document. It may be corrupt or password-protected.",
      },
      { status: 422 },
    );
  }
}
