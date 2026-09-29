import { loadMergedEnv } from "./load-env-files.mjs";

const env = {
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
  ...process.env
};
const baseUrl = (process.env.PILOT_URL || env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
const requestCount = Math.max(10, Math.min(200, Number(process.env.PILOT_REQUESTS || 30)));
const concurrency = Math.max(1, Math.min(20, Number(process.env.PILOT_CONCURRENCY || 6)));

if (!baseUrl.startsWith("https://")) {
  console.error("PILOT_URL ou NEXT_PUBLIC_APP_URL doit etre une adresse HTTPS.");
  process.exit(1);
}

const jobs = Array.from({ length: requestCount }, (_, index) =>
  index % 2 === 0 ? "/api/health" : "/login"
);
const measurements = [];
let nextJob = 0;

async function worker() {
  while (nextJob < jobs.length) {
    const index = nextJob++;
    const path = jobs[index];
    const startedAt = performance.now();
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { "Cache-Control": "no-cache", "User-Agent": "PrepaECG-Pilot-Check/1.0" },
        signal: AbortSignal.timeout(10_000)
      });
      const body = await response.text();
      const healthy = path !== "/api/health" || (!body.includes('"status":"fail"') && body.includes('"database","state":"pass"'));
      measurements.push({ path, duration: performance.now() - startedAt, ok: response.ok && healthy, status: response.status });
    } catch {
      measurements.push({ path, duration: performance.now() - startedAt, ok: false, status: 0 });
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
const durations = measurements.map((measurement) => measurement.duration).sort((a, b) => a - b);
const percentile = (ratio) => durations[Math.min(durations.length - 1, Math.ceil(durations.length * ratio) - 1)] ?? 0;
const failures = measurements.filter((measurement) => !measurement.ok);

console.log(`Controle de charge : ${requestCount} requetes, concurrence ${concurrency}.`);
console.log(`Temps : mediane ${Math.round(percentile(0.5))} ms, p95 ${Math.round(percentile(0.95))} ms, maximum ${Math.round(durations.at(-1) ?? 0)} ms.`);
console.log(`Erreurs : ${failures.length}.`);

if (failures.length > 0 || percentile(0.95) > 3000) {
  console.error("Le controle pilote n'atteint pas le seuil attendu (zero erreur et p95 inferieur a 3 s).");
  process.exit(1);
}
