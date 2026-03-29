// Maps column names to Prisma orderBy objects for each entity type.
// Returns undefined if the column isn't sortable, so the default orderBy is used.

type Order = "asc" | "desc";

export function articleOrderBy(sort: string | null, order: Order) {
  const map: Record<string, object> = {
    title: { title: order },
    writer: { writer: { name: order } },
    topic: { topic: { title: order } },
    date: { dateAdded: order },
    status: { display: order },
  };
  return sort && map[sort] ? map[sort] : { dateAdded: "desc" };
}

export function queryOrderBy(sort: string | null, order: Order) {
  const map: Record<string, object> = {
    title: { title: order },
    writer: { writer: { name: order } },
    topic: { topic: { title: order } },
    date: { dateAdded: order },
    status: { display: order },
  };
  return sort && map[sort] ? map[sort] : { dateAdded: "desc" };
}

export function issueOrderBy(sort: string | null, order: Order) {
  const map: Record<string, object> = {
    title: { title: order },
    volume: { volumeNumber: order },
    issueNumber: { issueNumber: order },
    date: { issueDate: order },
    status: { display: order },
  };
  return sort && map[sort] ? map[sort] : { issueDate: "desc" };
}

export function writerOrderBy(sort: string | null, order: Order) {
  const map: Record<string, object> = {
    name: { name: order },
    email: { email: order },
    status: { displayOnSite: order },
  };
  return sort && map[sort] ? map[sort] : { name: "asc" };
}

export function topicOrderBy(sort: string | null, order: Order) {
  const map: Record<string, object> = {
    title: { title: order },
    ranking: { ranking: order },
    status: { displayInList: order },
  };
  return sort && map[sort] ? map[sort] : { ranking: "asc" };
}

export function bookOrderBy(sort: string | null, order: Order) {
  const map: Record<string, object> = {
    title: { title: order },
    writer: { writer: { name: order } },
    type: { isBook: order },
    status: { display: order },
    date: { postDate: order },
  };
  return sort && map[sort] ? map[sort] : { postDate: "desc" };
}

export function userOrderBy(sort: string | null, order: Order) {
  const map: Record<string, object> = {
    name: { name: order },
    email: { email: order },
    role: { role: order },
    joined: { createdAt: order },
    status: { isActive: order },
  };
  return sort && map[sort] ? map[sort] : { createdAt: "desc" };
}

export function parseSort(searchParams: { sort?: string; order?: string }) {
  const sort = searchParams.sort ?? null;
  const order: Order = searchParams.order === "desc" ? "desc" : "asc";
  return { sort, order };
}
