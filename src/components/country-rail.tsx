import { Minus, Plus, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClientsStore } from "@/lib/clients-store";
import { countriesWithClients, sumCounts } from "@/lib/countries";
import { clientLabel, cn, formatCount } from "@/lib/utils";
import { COUNTRY_NAMES, countryName } from "@/lib/world";

export function CountryRail({ className }: { className?: string }) {
  const counts = useClientsStore((s) => s.counts);
  const selectedId = useClientsStore((s) => s.selectedId);
  const setSelected = useClientsStore((s) => s.setSelected);
  const setCount = useClientsStore((s) => s.setCount);
  const reset = useClientsStore((s) => s.reset);
  const [query, setQuery] = useState("");

  const total = sumCounts(counts);
  const active = countriesWithClients(counts);
  const selectedCount = selectedId ? (counts[selectedId] ?? 0) : 0;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ids = Object.keys(COUNTRY_NAMES);
    const list = ids
      .map((id) => ({
        id,
        name: countryName(id),
        n: counts[id] ?? 0,
      }))
      .filter((row) => (q ? row.name.toLowerCase().includes(q) : row.n > 0))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    return list;
  }, [counts, query]);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col bg-surface shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">By country</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="Clients" value={formatCount(total)} />
          <Stat label="Countries" value={formatCount(active)} />
        </div>
      </div>

      <div className="px-5 pb-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a country"
            className="pl-10"
            aria-label="Find a country"
          />
        </label>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {rows.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted">No country matches</li>
        )}
        {rows.map((row) => {
          const on = row.id === selectedId;
          const peak = rows[0]?.n || 1;
          const bar = peak > 0 && row.n > 0 ? Math.max(6, (row.n / peak) * 100) : 0;
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setSelected(on ? null : row.id)}
                className={cn(
                  "flex w-full flex-col gap-1.5 rounded-md px-3 py-2.5 text-left",
                  "transition-[background-color] duration-150 ease-out",
                  on ? "bg-surface-2" : "hover:bg-surface-2/60",
                )}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className={cn("text-sm", on ? "text-fg" : "text-fg/90")}>{row.name}</span>
                  <span className="font-mono text-xs tabular-nums text-muted">{formatCount(row.n)}</span>
                </span>
                <span className="h-0.5 overflow-hidden rounded-full bg-fg/8">
                  <span
                    className="block h-full rounded-full bg-accent/70"
                    style={{ width: `${bar}%` }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border px-5 py-4">
        {selectedId ? (
          <div>
            <p className="font-display text-xl leading-tight text-fg">{countryName(selectedId)}</p>
            <p className="mt-1 text-sm text-muted">{clientLabel(selectedCount)}</p>
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Decrease clients"
                onClick={() => setCount(selectedId, selectedCount - 1)}
              >
                <Minus />
              </Button>
              <Input
                type="number"
                min={0}
                max={99999}
                value={selectedCount}
                onChange={(e) => setCount(selectedId, Number(e.target.value) || 0)}
                className="text-center font-mono tabular-nums"
                aria-label="Client count"
              />
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Increase clients"
                onClick={() => setCount(selectedId, selectedCount + 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Select a country to edit its count.</p>
        )}
        <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={reset}>
          <RotateCcw />
          Reset counts
        </Button>
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-2 px-3 py-2.5 shadow-[var(--shadow-border)]">
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-0.5 font-mono text-lg tabular-nums text-fg">{value}</p>
    </div>
  );
}
