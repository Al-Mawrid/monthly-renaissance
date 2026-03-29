import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { TopicEditForm } from "./form";

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topicId = parseInt(id, 10);
  if (isNaN(topicId)) notFound();

  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) notFound();

  return (
    <div>
      <Link
        href="/admin/topics"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Topics
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {isAdmin ? "Edit Topic" : "Request Topic Edit"}
      </h1>
      <TopicEditForm topic={topic} isTeam={!isAdmin} />
    </div>
  );
}
