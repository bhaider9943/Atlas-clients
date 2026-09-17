/** Natural Earth 110m ids (ISO 3166-1 numeric, 3-digit). */
export const DISPLAY_NAMES: Record<string, string> = {
  "840": "United States",
  "180": "DR Congo",
  "214": "Dominican Republic",
  "140": "Central African Republic",
  "238": "Falkland Islands",
  "090": "Solomon Islands",
  "070": "Bosnia and Herzegovina",
  "732": "Western Sahara",
  "226": "Equatorial Guinea",
  "728": "South Sudan",
  "807": "North Macedonia",
  "748": "Eswatini",
  "260": "French Southern Lands",
  "540": "New Caledonia",
};

/** Seed book: USA 100, India 3, Pakistan 2, plus a full global roster. */
export const DEFAULT_COUNTS: Record<string, number> = {
  "840": 100,
  "826": 48,
  "276": 36,
  "124": 29,
  "156": 28,
  "036": 22,
  "250": 21,
  "784": 18,
  "702": 16,
  "528": 14,
  "392": 13,
  "076": 12,
  "484": 11,
  "724": 10,
  "380": 9,
  "372": 9,
  "410": 8,
  "616": 8,
  "682": 7,
  "056": 7,
  "158": 7,
  "752": 6,
  "756": 6,
  "376": 6,
  "710": 5,
  "554": 5,
  "566": 5,
  "040": 5,
  "578": 4,
  "208": 4,
  "458": 4,
  "792": 4,
  "360": 4,
  "203": 4,
  "356": 3,
  "818": 3,
  "608": 3,
  "764": 3,
  "032": 3,
  "620": 3,
  "246": 3,
  "634": 3,
  "643": 3,
  "586": 2,
  "050": 2,
  "170": 2,
  "404": 2,
  "704": 2,
  "152": 2,
  "642": 2,
  "348": 2,
  "300": 2,
  "804": 2,
  "414": 2,
  "442": 2,
  "703": 2,
  "512": 2,
  "012": 1,
  "504": 1,
  "288": 1,
  "800": 1,
  "858": 1,
  "604": 1,
  "144": 1,
  "524": 1,
  "352": 1,
  "191": 1,
  "705": 1,
  "100": 1,
  "233": 1,
  "428": 1,
  "440": 1,
  "400": 1,
  "422": 1,
  "196": 1,
  "688": 1,
  "070": 1,
  "218": 1,
  "068": 1,
};

export function displayName(id: string, rawName: string): string {
  return DISPLAY_NAMES[id] ?? rawName;
}

export function maxCount(counts: Record<string, number>): number {
  let max = 1;
  for (const n of Object.values(counts)) if (n > max) max = n;
  return max;
}

export function sumCounts(counts: Record<string, number>): number {
  let total = 0;
  for (const n of Object.values(counts)) total += n;
  return total;
}

export function countriesWithClients(counts: Record<string, number>): number {
  let n = 0;
  for (const v of Object.values(counts)) if (v > 0) n += 1;
  return n;
}
