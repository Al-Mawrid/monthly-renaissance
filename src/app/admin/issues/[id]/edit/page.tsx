import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { IssueEditForm } from "./form";

export default async function EditIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issueId = parseInt(id, 10);
  if (isNaN(issueId)) notFound();

  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) notFound();

  return (
    <div>
      <Link
        href="/admin/issues"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Issues
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {isAdmin ? "Edit Issue" : "Request Issue Edit"}
      </h1>
      <IssueEditForm issue={issue} isTeam={!isAdmin} />
    </div>
  );
}
