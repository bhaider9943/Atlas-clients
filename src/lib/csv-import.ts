import { COUNTRY_NAMES } from "@/lib/world";

export type CsvImportResult = {
  /** Full replacement counts map (every known country id gets a value, unlisted ones are 0). */
  counts: Record<string, number>;
  /** Rows that resolved to a country and a valid number. */
  matched: number;
  /** Data rows found in the file (header excluded). */
  totalRows: number;
  /** Raw country text from rows that couldn't be matched, for the user to fix and retry. */
  unmatched: string[];
};

/**
 * Common alternate names, abbreviations, and old names that people actually
 * type into a spreadsheet, mapped to the normalized form of the name used
 * in this app's map data.
 */
const ALIASES: Record<string, string> = {
  usa: "united states",
  us: "united states",
  "u s": "united states",
  "united states of america": "united states",
  america: "united states",
  uk: "united kingdom",
  "u k": "united kingdom",
  "great britain": "united kingdom",
  britain: "united kingdom",
  england: "united kingdom",
  uae: "united arab emirates",
  emirates: "united arab emirates",
  "russian federation": "russia",
  turkiye: "turkey",
  "viet nam": "vietnam",
  "republic of korea": "south korea",
  "korea south": "south korea",
  "korea republic": "south korea",
  "korea north": "north korea",
  dprk: "north korea",
  "congo brazzaville": "congo",
  "republic of the congo": "congo",
  "congo republic": "congo",
  "democratic republic of the congo": "dr congo",
  "dem rep congo": "dr congo",
  "congo kinshasa": "dr congo",
  drc: "dr congo",
  "congo dem rep": "dr congo",
  "czech republic": "czechia",
  macedonia: "north macedonia",
  fyrom: "north macedonia",
  swaziland: "eswatini",
  "ivory coast": "cote d ivoire",
  "cote divoire": "cote d ivoire",
  "cabo verde": "cape verde",
  burma: "myanmar",
  holland: "netherlands",
  "the netherlands": "netherlands",
  "syrian arab republic": "syria",
  "lao pdr": "laos",
  "brunei darussalam": "brunei",
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildIndex(): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const [id, name] of Object.entries(COUNTRY_NAMES)) {
    idx[normalize(name)] = id;
  }
  return idx;
}

function resolveId(raw: string, index: Record<string, string>): string | null {
  const trimmed = raw.trim();
  if (/^\d{1,3}$/.test(trimmed)) {
    const padded = trimmed.padStart(3, "0");
    if (COUNTRY_NAMES[padded]) return padded;
  }
  const norm = normalize(trimmed);
  if (index[norm]) return index[norm];
  const alias = ALIASES[norm];
  if (alias && index[alias]) return index[alias];
  return null;
}

/** Minimal RFC-4180-ish CSV parser: handles quoted fields, commas inside quotes, CRLF/LF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

/**
 * Parses a two-column CSV of `country,clients` (header row optional) into a
 * full counts map. Unmatched country names are returned so the caller can
 * show the user what to fix, rather than failing the whole import.
 */
export function importClientsCsv(text: string): CsvImportResult {
  const index = buildIndex();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { counts: {}, matched: 0, totalRows: 0, unmatched: [] };
  }

  const firstRow = rows[0];
  const secondCellLooksNumeric =
    firstRow.length > 1 && /^[\d.,]+$/.test(firstRow[1].trim()) && firstRow[1].trim() !== "";
  const dataRows = secondCellLooksNumeric ? rows : rows.slice(1);

  const counts: Record<string, number> = {};
  for (const id of Object.keys(COUNTRY_NAMES)) counts[id] = 0;

  let matched = 0;
  const unmatched: string[] = [];

  for (const cells of dataRows) {
    if (cells.length < 2) continue;
    const countryRaw = cells[0].trim();
    const countRaw = cells[1].replace(/[," ]/g, "");
    if (!countryRaw) continue;

    const n = Number.parseFloat(countRaw);
    if (Number.isNaN(n)) {
      unmatched.push(countryRaw);
      continue;
    }

    const id = resolveId(countryRaw, index);
    if (!id) {
      unmatched.push(countryRaw);
      continue;
    }

    counts[id] = Math.max(0, Math.min(99999, Math.round(n)));
    matched += 1;
  }

  return { counts, matched, totalRows: dataRows.length, unmatched };
}

/** Sample file so people know the expected shape without guessing. */
export function sampleCsv(): string {
  return "country,clients\nUnited States,120\nPakistan,45\nUnited Kingdom,30\nUAE,18\n";
}
