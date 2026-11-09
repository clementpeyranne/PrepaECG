export type MathTrack = "appliquees" | "approfondies";
export type MathExamCategory = "ecricome" | "emlyon" | "edhec" | "hec" | "maths-2";

export const mathExamCategories: { id: MathExamCategory; label: string }[] = [
  { id: "ecricome", label: "Ecricome" },
  { id: "emlyon", label: "emlyon" },
  { id: "edhec", label: "EDHEC" },
  { id: "hec", label: "HEC / ESSEC" },
  { id: "maths-2", label: "Maths 2" }
];

export type AnnalDocument = {
  url: string;
  sourcePage: string;
  format: "pdf" | "page";
  checkedAt: string;
};

export type MathAnnal = {
  id: string;
  track: MathTrack;
  category: MathExamCategory;
  year: number;
  title: string;
  legacy: "ECE" | "ECS" | null;
  subject: AnnalDocument | null;
  correction: AnnalDocument | null;
  sourcePage: string;
};

export type AnnalsFilters = {
  track: MathTrack;
  category: MathExamCategory | "all";
  year: string;
  query: string;
  correctedOnly: boolean;
};

function searchable(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function filterMathAnnals(records: MathAnnal[], filters: AnnalsFilters) {
  const query = searchable(filters.query);
  return records.filter((record) => {
    const label = mathExamCategories.find((category) => category.id === record.category)?.label ?? "";
    return record.track === filters.track
      && (filters.category === "all" || record.category === filters.category)
      && (filters.year === "all" || record.year === Number(filters.year))
      && (!filters.correctedOnly || Boolean(record.correction))
      && (!query || searchable(`${record.title} ${record.year} ${record.legacy ?? "ECG"} ${label}`).includes(query));
  }).sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "fr") || a.id.localeCompare(b.id));
}

export function annalSourceName(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const labels: Record<string, string> = {
    "annales-prepa.fr": "Annales-Prépa",
    "major-prepa.com": "Major Prépa",
    "ecricome.org": "Ecricome",
    "concours-bce.com": "BCE",
    "sosmath.jimdofree.com": "SOS Math",
    "drive.google.com": "Google Drive"
  };
  return labels[host] ?? host;
}
