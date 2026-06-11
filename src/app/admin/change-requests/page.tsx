import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ReviewButtons } from "./review-buttons";
import { DiffPanel } from "./diff-panel";
import { fetchCurrentEntity } from "./fetch-current";

export const dynamic = "force-dynamic";

export default async function ChangeRequestsPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const changeRequests = await prisma.changeRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { name: true, email: true, image: true } },
      reviewedBy: { select: { name: true } },
    },
    ...(!isAdmin ? { where: { requestedById: session?.user.id } } : {}),
  });

  const pending = changeRequests.filter((cr) => cr.status === "PENDING");
  const resolved = changeRequests.filter((cr) => cr.status !== "PENDING");

  const pendingWithCurrent = await Promise.all(
    pending.map(async (cr) => {
      const current =
        cr.action !== "CREATE" && cr.entityId
          ? await fetchCurrentEntity(cr.entityType, cr.entityId)
          : null;
      return { cr, current };
    }),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Change Requests</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} pending &middot; {resolved.length} resolved
        </p>
      </div>

      {pendingWithCurrent.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold">Pending</h2>
          {pendingWithCurrent.map(({ cr, current }) => {
            const proposed =
              cr.data && typeof cr.data === "object" && !Array.isArray(cr.data)
                ? (cr.data as Record<string, unknown>)
                : null;
            const action = cr.action as "CREATE" | "UPDATE" | "DELETE";

            return (
              <div
                key={cr.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground">#{cr.id}</span>
                    <span
                      className={`mr-tag ${
                        action === "CREATE"
                          ? "mr-tag-info"
                          : action === "UPDATE"
                            ? "mr-tag-warning"
                            : "mr-tag-danger"
                      }`}
                    >
                      {action}
                    </span>
                    <span className="capitalize">{cr.entityType}</span>
                    <span className="text-muted-foreground">
                      {cr.entityId ? `id ${cr.entityId}` : "new"}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {cr.requestedBy.image ? (
                        <img
                          src={cr.requestedBy.image}
                          alt=""
                          className="h-4 w-4 rounded-full"
                        />
                      ) : null}
                      {cr.requestedBy.name ?? cr.requestedBy.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cr.createdAt.toLocaleString()}
                    </span>
                  </div>
                  {isAdmin && <ReviewButtons requestId={cr.id} />}
                </div>

                {cr.note && (
                  <div className="border-b border-border bg-muted/30 px-4 py-2 text-sm">
                    <span className="font-medium">Note: </span>
                    <span className="text-muted-foreground">{cr.note}</span>
                  </div>
                )}

                <div className="p-4">
                  <DiffPanel
                    action={action}
                    current={current}
                    proposed={proposed}
                    currentMissing={
                      action === "DELETE" && cr.entityId !== null && current === null
                    }
                  />
                </div>
              </div>
            );
          })}
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
                      <span className={`mr-tag ${
                        cr.status === "APPROVED" ? "mr-tag-success" : "mr-tag-danger"
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
