import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { countryId, type CountryFeature, type CountryProps } from "@/lib/world";

export type MapDot = { x: number; y: number; id: string };

export type WorldMapModel = {
  dots: MapDot[];
  hit: Uint16Array;
  width: number;
  height: number;
  ids: string[];
  spherePath: Path2D | null;
};

const SKIP = new Set(["010", "260"]);

export function buildWorldMap(
  collection: FeatureCollection<Geometry, CountryProps>,
  width: number,
  height: number,
): WorldMapModel | null {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  if (w < 48 || h < 48) return null;

  const features = collection.features.filter((f) => !SKIP.has(countryId(f)));

  const padX = Math.max(12, w * 0.03);
  const padY = Math.max(10, h * 0.05);

  const projection = geoNaturalEarth1().fitExtent(
    [
      [padX, padY],
      [w - padX, h - padY],
    ],
    { type: "FeatureCollection", features } as GeoPermissibleObjects,
  );

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;

  const path = geoPath(projection, ctx);
  const ids: string[] = [];
  const idToIndex = new Map<string, number>();

  for (const f of features) {
    const id = countryId(f as CountryFeature);
    let idx = idToIndex.get(id);
    if (idx === undefined) {
      idx = ids.length;
      ids.push(id);
      idToIndex.set(id, idx);
    }
    const n = idx + 1;
    ctx.fillStyle = `rgb(${n & 255},${(n >> 8) & 255},0)`;
    ctx.beginPath();
    path(f as GeoPermissibleObjects);
    ctx.fill();
  }

  const pixels = ctx.getImageData(0, 0, w, h).data;
  const hit = new Uint16Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (pixels[o + 3] < 140) continue;
    const n = pixels[o] + (pixels[o + 1] << 8);
    if (n > 0 && n <= ids.length) hit[i] = n;
  }

  const spacing = Math.min(7.5, Math.max(4.2, w / 230));
  const dy = spacing * 0.86;
  const dots: MapDot[] = [];

  for (let row = 0, y = spacing; y < h - spacing * 0.5; row += 1, y += dy) {
    const x0 = spacing * 0.6 + (row % 2 === 1 ? spacing * 0.5 : 0);
    for (let x = x0; x < w - spacing * 0.5; x += spacing) {
      const px = Math.min(w - 1, Math.max(0, Math.round(x)));
      const py = Math.min(h - 1, Math.max(0, Math.round(y)));
      let n = hit[py * w + px];
      if (!n) {
        const east = hit[py * w + Math.min(w - 1, px + 1)];
        const west = hit[py * w + Math.max(0, px - 1)];
        const south = hit[Math.min(h - 1, py + 1) * w + px];
        const north = hit[Math.max(0, py - 1) * w + px];
        n = east || west || south || north;
      }
      if (!n) continue;
      dots.push({ x, y, id: ids[n - 1] ?? ids[0] });
    }
  }

  let spherePath: Path2D | null = null;
  try {
    const p = new Path2D();
    const path2 = geoPath(projection, {
      beginPath() {},
      moveTo(x, y) {
        p.moveTo(x, y);
      },
      lineTo(x, y) {
        p.lineTo(x, y);
      },
      closePath() {
        p.closePath();
      },
      arc(x, y, r, a0, a1) {
        p.arc(x, y, r, a0, a1, false);
      },
    });
    path2({ type: "Sphere" });
    spherePath = p;
  } catch {
    spherePath = null;
  }

  return { dots, hit, width: w, height: h, ids, spherePath };
}

export function hitCountry(model: WorldMapModel, x: number, y: number): string | null {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= model.width || py >= model.height) return null;

  const at = (xx: number, yy: number) => {
    if (xx < 0 || yy < 0 || xx >= model.width || yy >= model.height) return 0;
    return model.hit[yy * model.width + xx];
  };

  let n = at(px, py);
  if (!n) {
    const r = 5;
    outer: for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const v = at(px + dx, py + dy);
        if (v) {
          n = v;
          break outer;
        }
      }
    }
  }
  if (!n) return null;
  return model.ids[n - 1] ?? null;
}
