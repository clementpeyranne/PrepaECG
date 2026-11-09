import { readFile, writeFile, mkdir } from "node:fs/promises";

// This maintenance task never runs during a page request or a deployment build.
const input = JSON.parse(await readFile("/tmp/math-annals-candidates.json", "utf8"));
const checkedAt = new Date().toISOString();
const cachePath = "/tmp/math-annals-link-checks.json";
const cache = process.argv.includes("--resume")
  ? JSON.parse(await readFile(cachePath, "utf8").catch(() => "{}")) : {};
const checks = new Map();
let cursor = 0;

async function check(url) {
  if (cache[url] && Date.now() - Date.parse(cache[url].checkedAt) < 86400000) return cache[url];
  if (checks.has(url)) return checks.get(url);
  const pending = (async () => {
    let result;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: { Range: "bytes=0-65535", "User-Agent": "Prepatempo-LinkCheck/1.0" }
      });
      const reader = response.body?.getReader();
      let content = "";
      if (reader) {
        const limit = /text\/html/i.test(response.headers.get("content-type") ?? "") ? 2000000 : 65536;
        while (content.length < limit) {
          const { value, done } = await reader.read();
          if (done) break;
          content += new TextDecoder().decode(value);
        }
        await reader.cancel();
      }
      const pdf = content.startsWith("%PDF-");
      const html = /text\/html/i.test(response.headers.get("content-type") ?? "");
      const title = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
      const blocked = /404|not found|introuvable|sign.in|connexion|access denied|just a moment|one moment|page inaccessible|error/i.test(title)
        || /accounts\.google\.com/.test(response.url);
      const wrongPdf = /\.pdf(?:\?|$)/i.test(url) && !pdf;
      const pendingCorrection = /major-prepa.com\/mathematiques\/corrige/.test(url)
        && /[aà] venir/i.test(content.slice(content.indexOf("NB :"), content.indexOf("NB :") + 2500).replace(/<[^>]+>/g, " "));
      result = { ok: response.ok && (pdf || html) && !blocked && !wrongPdf && !pendingCorrection, status: response.status, format: pdf ? "pdf" : "page", checkedAt };
    } catch (error) {
      result = { ok: false, status: error.name, checkedAt };
    }
    cache[url] = result;
    return result;
  })();
  checks.set(url, pending);
  return pending;
}

async function select(links) {
  for (const link of links) {
    const result = await check(link.url);
    if (result.ok) return { ...link, format: result.format, checkedAt: result.checkedAt };
  }
  return null;
}

const records = new Array(input.records.length);
async function worker() {
  while (cursor < input.records.length) {
    const index = cursor++;
    const { subjects, corrections, ...record } = input.records[index];
    const subject = await select(subjects);
    const correction = await select(corrections);
    records[index] = { ...record, subject, correction, sourcePage: subjects[0]?.sourcePage ?? corrections[0]?.sourcePage };
    if ((index + 1) % 25 === 0) console.log(`${index + 1}/${records.length} epreuves controlees`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
await writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n");
await mkdir("src/data", { recursive: true });
await writeFile("src/data/math-annals.json", JSON.stringify({ indexedAt: input.indexedAt, checkedAt, sources: input.sources, records }, null, 2) + "\n");
console.log(JSON.stringify({ records: records.length, subjects: records.filter((r) => r.subject).length, corrections: records.filter((r) => r.correction).length, missing: records.filter((r) => !r.subject || !r.correction).map((r) => ({ id: r.id, subject: !!r.subject, correction: !!r.correction })) }, null, 2));
