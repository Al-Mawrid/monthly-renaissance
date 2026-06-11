export function logError(
  scope: string,
  err: unknown,
  context?: Record<string, unknown>,
): void {
  const payload = {
    level: "error",
    scope,
    ts: new Date().toISOString(),
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    ...context,
  };
  console.error(JSON.stringify(payload));
}
