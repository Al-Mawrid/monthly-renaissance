import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canEditContent } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !canEditContent(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/epub+zip",
    "application/x-mobipocket-ebook",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|epub|mobi|docx)$/i)) {
    return NextResponse.json(
      { error: "Only PDF, EPUB, MOBI, and DOCX files are allowed" },
      { status: 400 },
    );
  }

  // Max 50MB
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  // Generate safe filename
  const ext = path.extname(file.name);
  const baseName = file.name
    .replace(ext, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const timestamp = Date.now();
  const fileName = `${baseName}-${timestamp}${ext}`;

  // Save to public/books/
  const uploadDir = path.join(process.cwd(), "public", "books");
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);

  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  return NextResponse.json({
    fileName,
    url: `/books/${fileName}`,
    originalName: file.name,
    size: file.size,
  });
}
