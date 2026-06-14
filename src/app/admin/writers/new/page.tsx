import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { WriterCreateForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewWriterPage() {
  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

  return (
    <div>
      <Link
        href="/admin/writers"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 -ml-2 text-muted-foreground")}
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Writers
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        {isAdmin ? "New Writer" : "Request New Writer"}
      </h1>

      <WriterCreateForm isTeam={!isAdmin} />
    </div>
  );
}
