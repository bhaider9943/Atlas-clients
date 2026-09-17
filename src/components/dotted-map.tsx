import { useCallback, useEffect, useRef, useState } from "react";
import { buildWorldMap, hitCountry, type WorldMapModel } from "@/lib/build-map";
import { maxCount } from "@/lib/countries";
import { useClientsStore } from "@/lib/clients-store";
import { clientLabel } from "@/lib/utils";
import { countryName, worldCountries } from "@/lib/world";

const LAND = { r: 243, g: 243, b: 238 };
const ACCENT = { r: 213, g: 219, b: 230 };
const HOVER = { r: 255, g: 255, b: 252 };

type Tooltip = { id: string; x: number; y: number };

function mix(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function drawMap(
  ctx: CanvasRenderingContext2D,
  model: WorldMapModel,
  counts: Record<string, number>,
  hovered: string | null,
  selected: string | null,
  cssW: number,
  cssH: number,
  dpr: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  if (model.spherePath) {
    ctx.strokeStyle = "rgba(243, 243, 238, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke(model.spherePath);
  }

  const max = maxCount(counts);
  const focused = hovered ?? selected;
  const { dots } = model;

  for (const d of dots) {
    const n = counts[d.id] ?? 0;
    const isFocus = focused !== null && d.id === focused;
    const isDim = focused !== null && d.id !== focused;
    const t = n <= 0 ? 0 : 0.38 + 0.62 * Math.sqrt(n / max);
    const col = n <= 0 ? LAND : mix(LAND, ACCENT, Math.min(1, t));
    let alpha = n <= 0 ? 0.13 : 0.28 + 0.72 * t;
    if (isDim) alpha *= 0.22;
    if (isFocus) alpha = n > 0 ? 1 : 0.55;

    const r = isFocus ? (n > 0 ? 2.15 : 1.7) : n > 0 ? 1.35 + 0.7 * t : 1.2;

    ctx.beginPath();
    ctx.fillStyle = isFocus
      ? `rgba(${HOVER.r},${HOVER.g},${HOVER.b},${alpha})`
      : `rgba(${col.r},${col.g},${col.b},${alpha})`;
    ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function DottedMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<WorldMapModel | null>(null);
  const counts = useClientsStore((s) => s.counts);
  const selectedId = useClientsStore((s) => s.selectedId);
  const hoveredId = useClientsStore((s) => s.hoveredId);
  const setSelected = useClientsStore((s) => s.setSelected);
  const setHovered = useClientsStore((s) => s.setHovered);
  const countsRef = useRef(counts);
  const selectedRef = useRef(selectedId);
  const hoveredRef = useRef(hoveredId);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [hint, setHint] = useState(true);

  countsRef.current = counts;
  selectedRef.current = selectedId;
  hoveredRef.current = hoveredId;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const model = modelRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !model || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    drawMap(
      ctx,
      model,
      countsRef.current,
      hoveredRef.current,
      selectedRef.current,
      rect.width,
      rect.height,
      dpr,
    );
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let frame = 0;
    const rebuild = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w < 48 || h < 48) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const model = buildWorldMap(worldCountries, w, h);
      if (!model) return;
      modelRef.current = model;
      paint();
    };

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(rebuild);
    });
    ro.observe(wrap);
    rebuild();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [paint]);

  useEffect(() => {
    paint();
  }, [counts, selectedId, hoveredId, paint]);

  useEffect(() => {
    if (!hoveredId) setTooltip(null);
  }, [hoveredId]);

  const updateHover = (clientX: number, clientY: number, pin: boolean) => {
    const wrap = wrapRef.current;
    const model = modelRef.current;
    if (!wrap || !model) return;
    const rect = wrap.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = hitCountry(model, x, y);
    if (id) {
      setHint(false);
      setHovered(id);
      setTooltip({
        id,
        x: Math.min(rect.width - 16, Math.max(16, x)),
        y: Math.min(rect.height - 16, Math.max(16, y)),
      });
      wrap.style.cursor = "pointer";
    } else {
      setHovered(null);
      setTooltip(null);
      wrap.style.cursor = "crosshair";
    }
    if (pin) {
      useClientsStore.setState({ selectedId: id, hoveredId: id });
    }
    paint();
  };

  const n = tooltip ? (counts[tooltip.id] ?? 0) : 0;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const share = tooltip && total > 0 && n > 0 ? Math.round((n / total) * 1000) / 10 : 0;

  return (
    <div
      ref={wrapRef}
      className="relative h-full min-h-[280px] w-full overflow-hidden"
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        updateHover(e.clientX, e.clientY, false);
      }}
      onPointerDown={(e) => {
        updateHover(e.clientX, e.clientY, true);
      }}
      onPointerLeave={() => {
        setHovered(null);
        setTooltip(null);
        paint();
      }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="Dotted world map of clients by country"
      />

      {hint && !tooltip && (
        <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 px-4 text-center text-sm text-muted atlas-in">
          Move across a country to read its client count
        </p>
      )}

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 w-56 rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform:
              tooltip.y < 96
                ? "translate(-50%, 14px)"
                : "translate(-50%, calc(-100% - 14px))",
          }}
        >
          <p className="font-display text-lg leading-snug text-fg">{countryName(tooltip.id)}</p>
          <p className="mt-1 font-mono text-sm tabular-nums text-accent">{clientLabel(n)}</p>
          {n > 0 && <p className="mt-0.5 text-xs text-subtle">{share}% of all clients</p>}
        </div>
      )}
    </div>
  );
}
