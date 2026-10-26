export function getRuntimeDatabaseUrl(rawUrl: string | undefined, serverless = Boolean(process.env.VERCEL)) {
  if (!rawUrl?.trim()) return undefined;
  const value = rawUrl.trim();
  if (!/^postgres(?:ql)?:\/\//.test(value)) return value;
  const url = new URL(value);
  if (!url.hostname.endsWith(".pooler.supabase.com")) return value;

  // Prisma CLI keeps DIRECT_URL; only short-lived Vercel requests use transaction pooling.
  if (serverless && url.port === "5432") url.port = "6543";
  if (url.port === "6543") url.searchParams.set("pgbouncer", "true");
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", serverless ? "3" : "1");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "10");
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "10");
  return url.toString();
}
