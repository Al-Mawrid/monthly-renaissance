import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/unauthorized");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Site configuration and preferences</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Settings className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-muted-foreground">Coming Soon</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Site settings will be configurable here in a future update.
        </p>
      </div>
    </div>
  );
}
