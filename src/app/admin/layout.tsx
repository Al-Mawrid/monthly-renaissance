import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UndoProvider } from "./undo-context";
import { AdminSidebar } from "./_components/admin-sidebar";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEAM") {
    redirect("/unauthorized");
  }

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get("admin_sidebar_collapsed")?.value === "true";

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      <AdminSidebar
        role={role}
        user={{ name: session.user.name, image: session.user.image }}
        defaultCollapsed={defaultCollapsed}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <UndoProvider>
          <div className="p-6 lg:p-8">{children}</div>
        </UndoProvider>
      </main>
    </div>
  );
}
