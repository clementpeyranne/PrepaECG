import { readFile, writeFile, mkdir } from "node:fs/promises";

// Only public link metadata is indexed; documents remain with their publishers.
const sources = [
  ["applied", "appliquees", "school", "https://www.annales-prepa.fr/maths/ecrits/e/par-ecole/"],
  ["advanced", "approfondies", "school", "https://www.annales-prepa.fr/maths/ecrits/s/par-ecole/"],
  ["major-applied", "appliquees", "year", "https://major-prepa.com/annales-concours-bce-ecricome/mathematiques/annales-mathematiques-appliquees-annee/"],
  ["major-advanced", "approfondies", "year", "https://major-prepa.com/annales-concours-bce-ecricome/mathematiques/annales-mathematiques-approfondies/"]
];
const indexedAt = new Date().toISOString();
const lastYear = Math.min(new Date().getFullYear(), 2026);
const decode = (text) => text.replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n)))
  .replaceAll("&amp;", "&").replaceAll("&nbsp;", " ").replaceAll("&quot;", '"').replaceAll("&rsquo;", "'").replaceAll("&eacute;", "é");
const plain = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const normalize = (text) => plain(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const catalog = new Map();

function identify(label, track, year) {
  const name = normalize(label);
  if (/ecricome/.test(name)) return ["ecricome", "ecricome", "Ecricome"];
  if (/em\s*lyon/.test(name)) return ["emlyon", "emlyon", "emlyon"];
  if (/edhec/.test(name)) return ["edhec", "edhec", "EDHEC"];
  const second = /maths\s*(?:2|ii\b)|maths\s*\(ii\)/.test(name);
  if (name.includes("hec") && name.includes("escp")) return ["maths-2", "maths-2", "HEC / ESCP - Maths 2"];
  if (name.includes("hec") && name.includes("essec")) return ["hec", "hec", "HEC / ESSEC - Maths 1"];
  if (name.includes("hec")) return second
    ? ["hec-2", "maths-2", "HEC - Maths 2"] : ["hec", "hec", "HEC - Maths 1"];
  if (name.includes("essec")) {
    if (second) return track === "appliquees"
      ? ["maths-2", "maths-2", "ESSEC - Maths 2"] : ["essec-2", "maths-2", "ESSEC - Maths 2"];
    return ["essec-1", "hec", "ESSEC - Maths 1"];
  }
  if (name.includes("escp") && track === "appliquees" && year <= 2005) return ["escp", "maths-2", "ESCP"];
  return null;
}

for (const [cache, track, layout, sourcePage] of sources) {
  const html = process.argv.includes("--refresh")
    ? await fetch(sourcePage, { signal: AbortSignal.timeout(30000) }).then((response) => {
      if (!response.ok) throw new Error(`Archive HTTP ${response.status}: ${sourcePage}`);
      return response.text();
    })
    : await readFile(`/tmp/annales-${cache}.html`, "utf8");
  const headings = [...html.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)];
  for (let i = 0; i < headings.length; i++) {
    const heading = plain(headings[i][1]);
    if (layout === "year" && !/^20\d\d(?:\s|:|$)/.test(heading)) continue;
    if (layout === "school" && !/^Maths\b/.test(heading)) continue;
    const section = html.slice(headings[i].index + headings[i][0].length, headings[i + 1]?.index ?? html.length);
    for (const row of section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
      const rowText = plain(row[1]);
      const year = Number((layout === "school" ? rowText : heading).match(/^\s*(20\d\d)/)?.[1]);
      if (year < 2000 || year > lastYear || !year) continue;
      const identity = identify(layout === "school" ? heading : rowText.split(":")[0], track, year);
      if (!identity) continue;
      const [exam, category, title] = identity;
      const id = `${track}-${exam}-${year}`;
      const record = catalog.get(id) ?? { id, track, category, year, title, legacy: year < 2023 ? track === "appliquees" ? "ECE" : "ECS" : null, subjects: [], corrections: [] };
      for (const a of row[1].matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
        const kind = normalize(a[2]);
        if (kind !== "sujet" && kind !== "corrige") continue;
        let url = new URL(decode(a[1]), sourcePage);
        if (url.hostname === "google.com" && url.pathname === "/url") url = new URL(url.searchParams.get("q"));
        if (!["https:", "http:"].includes(url.protocol)) continue;
        // The source incorrectly labels the EDHEC statement as ESSEC's 2026 solution.
        if (kind === "corrige" && /298-MATHEMATIQUES_APPLIQUEES_EDHEC_BS/.test(url.href)) continue;
        const list = kind === "sujet" ? record.subjects : record.corrections;
        if (!list.some((link) => link.url === url.href)) list.push({ url: url.href, sourcePage });
      }
      if (record.subjects.length || record.corrections.length) catalog.set(id, record);
    }
  }
}

// Editorial errors in the upstream indexes must not become student-facing links.
const rejected = [
  ["appliquees-hec-2020", "subjects", "2020_Essec_2_sujet.pdf"],
  ["approfondies-essec-1-2016", "corrections", "Corrige-du-sujet-dannale-de-maths-1-HEC-ECS-2016.pdf"],
  ["appliquees-ecricome-2014", "subjects", "Maths_Ecricome_2000_ECE_Sujet_mathematiques_prepa_HEC.pdf"],
  ["appliquees-edhec-2013", "corrections", "EMLyon-2013-E-corrige-Major-Prepa.pdf"],
  ["appliquees-edhec-2011", "corrections", "EMLyon-2011-E-corrige-Major-Prepa.pdf"],
  ["appliquees-essec-1-2013", "corrections", "ESSEC-MathsII-E-2013-corrige-Major-Prepa.pdf"],
  // These pages advertise last year's correction and say "A venir" for 2026.
  ["approfondies-hec-2026", "corrections", "corrige-maths-1-approfondies-hec-essec-2026"],
  ["approfondies-maths-2-2026", "corrections", "corrige-maths-2-approfondies-hec-escp-2026"]
];
for (const [id, kind, filename] of rejected) {
  const record = catalog.get(id);
  if (record) record[kind] = record[kind].filter((link) => !link.url.includes(filename));
}
catalog.get("appliquees-hec-2026").corrections.unshift({
  url: "https://sosmath.jimdofree.com/app/download/16894615322/HEC_ESSEC_2026_corrig%C3%A9.pdf?t=1778070801",
  sourcePage: "https://sosmath.jimdofree.com/ecg-2/annales-%C3%A0-partir-de-2023/"
});
const additions = [
  ["appliquees-edhec-2026", "https://jeremylegendre.fr/wp-content/uploads/EDHEC2026Appli_CORRIGE.pdf", "https://jeremylegendre.fr/annales-concours-bce-ecricome/"],
  ["appliquees-emlyon-2026", "https://jeremylegendre.fr/wp-content/uploads/EML2026Appli_CORRIGE.pdf", "https://jeremylegendre.fr/annales-concours-bce-ecricome/"],
  ["appliquees-ecricome-2026", "https://sosmath.jimdofree.com/app/download/16894612722/Corrige%CC%81_Maths_Appliquees_2026.pdf?t=1778070206", "https://sosmath.jimdofree.com/ecg-2/annales-%C3%A0-partir-de-2023/"],
  ["appliquees-maths-2-2026", "https://www.excellence-maths.fr/wp-content/uploads/2026/04/correction-bce-ecg-appliquees-maths-2-appli-essec-2026.pdf", "https://wikiprepa.fr/concours/ecrit/bce_maths-appliquees-essec-2_ecg_2026"],
  ["approfondies-hec-2026", "https://www.excellence-maths.fr/wp-content/uploads/2026/04/correction-bce-ecg-approfondies-maths-i-appro-essec-hec-2026.pdf", "https://wikiprepa.fr/concours/ecrit/bce_maths-approfondies-hec-essec_ecg_2026"],
  ["approfondies-edhec-2026", "https://drive.google.com/file/d/1A2Rs8o2thfFIB6zAPHv5yrjir8OgOy6U/view?usp=sharing", "https://sites.google.com/view/mathmatiquesecg/annales/maths-approfondies/edhec"],
  ["approfondies-emlyon-2026", "https://drive.google.com/file/d/1Lu1Jvs18ziKzWS20eGxjKrydH50ySS9v/view", "https://prepaindex.fr/annales/ecg/bce/maths-approfondies/emlyon/maths-approfondies-emlyon-2026-corrige"],
  ["approfondies-ecricome-2026", "https://drive.google.com/file/d/1MEfrXXwzFuSWI6h-IntRlMjI4sj6lwm7/view?usp=sharing", "https://sites.google.com/view/mathmatiquesecg/annales/maths-approfondies/ecricome"]
];
for (const [id, url, sourcePage] of additions) catalog.get(id).corrections.unshift({ url, sourcePage });
// Three distinct EDHEC 2018 papers: keep each statement paired with its solution.
const edhecSource = "https://sites.google.com/view/mathmatiquesecg/annales/maths-approfondies/edhec";
const edhecBase = catalog.get("approfondies-edhec-2018");
for (const [id, title, subjectId, correctionId] of [
  ["approfondies-edhec-2018", "EDHEC", "1eIIaxgcybMedot8HCEU3ODW_czuBIBhT", "18ugQSezd_wXH4N5zUTmoOLJ2dtYxau7h"],
  ["approfondies-edhec-annule-2018", "EDHEC - Épreuve annulée", "1n2m7GBD5ARtipKlP_itKYXA-4DSJwZPQ", "197zyyed4HeeYzxfefIUt3XxuMkhZtxev"],
  ["approfondies-edhec-clermont-2018", "EDHEC - Sujet de Clermont", "1eGrUL9_zTL5Pl80eIxvHGqMyyppyHPZm", "19IB32klPQCAU_jD4wBbBEs71zPSf6SY1"]
]) {
  catalog.set(id, {
    ...edhecBase, id, title,
    subjects: [{ url: `https://drive.google.com/file/d/${subjectId}/view`, sourcePage: edhecSource }],
    corrections: [{ url: `https://drive.google.com/file/d/${correctionId}/view`, sourcePage: edhecSource }]
  });
}
// Earlier ECE papers were numbered differently (including Maths III).
for (const record of catalog.values()) {
  if (record.legacy && record.title === "HEC - Maths 1") record.title = "HEC";
  if (record.legacy === "ECE" && record.title === "ESSEC - Maths 1") record.title = "ESSEC";
}
const records = [...catalog.values()].sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
await mkdir("src/data", { recursive: true });
await writeFile("/tmp/math-annals-candidates.json", JSON.stringify({ indexedAt, sources: sources.map((s) => s[3]), records }, null, 2) + "\n");
for (const track of ["appliquees", "approfondies"]) {
  for (const category of ["ecricome", "emlyon", "edhec", "hec", "maths-2"]) {
    const matches = records.filter((r) => r.track === track && r.category === category);
    console.log(track, category, matches.length, "sujets", matches.filter((r) => r.subjects.length).length, "corriges", matches.filter((r) => r.corrections.length).length);
  }
}
console.log(records.length, "epreuves indexees. Verifier les liens avant publication.");
