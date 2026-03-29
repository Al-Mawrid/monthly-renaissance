import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Unauthorized",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to access this page. Please contact an
          administrator if you believe this is an error.
        </p>
        <Link href="/" className={cn(buttonVariants())}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
