import { Globe2, List, X } from "lucide-react";
import { useState } from "react";
import { CountryRail } from "@/components/country-rail";
import { DottedMap } from "@/components/dotted-map";
import { Button } from "@/components/ui/button";
import { useClientsStore } from "@/lib/clients-store";
import { countriesWithClients, sumCounts } from "@/lib/countries";
import { formatCount } from "@/lib/utils";

export function AtlasApp() {
  const counts = useClientsStore((s) => s.counts);
  const [open, setOpen] = useState(false);
  const total = sumCounts(counts);
  const active = countriesWithClients(counts);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 atlas-in">
          <span className="grid size-9 place-items-center rounded-md bg-surface shadow-[var(--shadow-border)]">
            <Globe2 className="size-4 text-accent" />
          </span>
          <div>
            <h1 className="font-display text-xl leading-none tracking-tight sm:text-2xl">
              Client Atlas
            </h1>
            <p className="mt-1 hidden text-xs text-muted sm:block">Hover any dot to read the count</p>
          </div>
        </div>
        <div className="flex items-center gap-2 atlas-in atlas-in-delay-1">
          <p className="hidden font-mono text-xs tabular-nums text-muted md:block">
            {formatCount(total)} clients · {formatCount(active)} countries
          </p>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open country list"
          >
            <List />
            Countries
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative min-h-0 flex-1">
          <DottedMap />
          <Legend />
        </main>

        <CountryRail className="hidden w-[340px] shrink-0 rounded-tl-xl lg:flex" />
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bg/70"
            aria-label="Close country list"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(100%,340px)] flex-col bg-surface">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>
            <CountryRail className="min-h-0 flex-1" />
          </div>
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 hidden items-center gap-4 rounded-md bg-surface/90 px-3 py-2 text-xs text-muted shadow-[var(--shadow-border)] sm:flex atlas-in atlas-in-delay-2">
      <span className="flex items-center gap-1.5">
        <i className="size-1.5 rounded-full bg-fg/25" />
        Land
      </span>
      <span className="flex items-center gap-1.5">
        <i className="size-1.5 rounded-full bg-accent/70" />
        Clients
      </span>
      <span className="flex items-center gap-1.5">
        <i className="size-2 rounded-full bg-accent" />
        Concentrated
      </span>
    </div>
  );
}
