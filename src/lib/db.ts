import { PrismaClient } from "@prisma/client";

const DEFAULT_CONNECTION_LIMIT = 1;

function getDatasourceUrl(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || /[?&]connection_limit=/i.test(databaseUrl)) {
    return databaseUrl;
  }

  const configuredLimit = Number(process.env.DATABASE_CONNECTION_LIMIT);
  const connectionLimit =
    Number.isSafeInteger(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : DEFAULT_CONNECTION_LIMIT;
  const separator = databaseUrl.includes("?") ? "&" : "?";

  return `${databaseUrl}${separator}connection_limit=${connectionLimit}`;
}

function createPrismaClient() {
  const datasourceUrl = getDatasourceUrl();
  return new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Next.js can evaluate this module from multiple production route bundles.
// Keeping the client on globalThis prevents each bundle from creating its own
// connection pool inside the same Passenger process.
globalForPrisma.prisma = prisma;
