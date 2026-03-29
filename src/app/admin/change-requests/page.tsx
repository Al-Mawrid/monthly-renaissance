import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ReviewButtons } from "./review-buttons";

export default async function ChangeRequestsPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const changeRequests = await prisma.changeRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { name: true, email: true, image: true } },
      reviewedBy: { select: { name: true } },
    },
    // TEAM users only see their own requests
    ...(!isAdmin ? { where: { requestedById: session?.user.id } } : {}),
  });

  const pending = changeRequests.filter((cr) => cr.status === "PENDING");
  const resolved = changeRequests.filter((cr) => cr.status !== "PENDING");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Change Requests</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} pending &middot; {resolved.length} resolved
        </p>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Pending</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                  {isAdmin && <TableHead className="w-32">Review</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((cr) => (
                  <TableRow key={cr.id}>
                    <TableCell className="text-muted-foreground text-xs">{cr.id}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cr.action === "CREATE"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : cr.action === "UPDATE"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {cr.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{cr.entityType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cr.entityId ?? "New"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {cr.requestedBy.image ? (
                          <img src={cr.requestedBy.image} alt="" className="h-5 w-5 rounded-full" />
                        ) : null}
                        <span className="text-sm">{cr.requestedBy.name ?? cr.requestedBy.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                      {cr.note ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cr.createdAt.toLocaleDateString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <ReviewButtons requestId={cr.id} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Resolved</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Reviewed By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolved.map((cr) => (
                  <TableRow key={cr.id}>
                    <TableCell className="text-muted-foreground text-xs">{cr.id}</TableCell>
                    <TableCell className="text-xs capitalize">{cr.action.toLowerCase()}</TableCell>
                    <TableCell className="text-sm capitalize">{cr.entityType}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        cr.status === "APPROVED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {cr.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{cr.requestedBy.name ?? cr.requestedBy.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cr.reviewedBy?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cr.reviewedAt?.toLocaleDateString() ?? cr.createdAt.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {changeRequests.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No change requests yet.</p>
        </div>
      )}
    </div>
  );
}
