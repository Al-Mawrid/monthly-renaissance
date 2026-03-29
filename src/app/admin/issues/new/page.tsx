import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { canManageContent } from "@/lib/permissions";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { IssueCreateForm } from "./form";

export default async function NewIssuePage() {
  const session = await auth();
  const isAdmin = canManageContent(session!.user.role);

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
        {isAdmin ? "New Issue" : "Request New Issue"}
      </h1>
      <IssueCreateForm isTeam={!isAdmin} />
    </div>
  );
}
