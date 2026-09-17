import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_COUNTS } from "@/lib/countries";

type ClientsState = {
  counts: Record<string, number>;
  selectedId: string | null;
  hoveredId: string | null;
  setHovered: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  setCount: (id: string, n: number) => void;
  reset: () => void;
};

export const useClientsStore = create<ClientsState>()(
  persist(
    (set, get) => ({
      counts: { ...DEFAULT_COUNTS },
      selectedId: null,
      hoveredId: null,
      setHovered: (id) => set({ hoveredId: id }),
      setSelected: (id) => set({ selectedId: id, hoveredId: null }),
      setCount: (id, n) => {
        const next = Math.max(0, Math.min(99999, Math.round(n)));
        set({ counts: { ...get().counts, [id]: next } });
      },
      reset: () => set({ counts: { ...DEFAULT_COUNTS } }),
    }),
    {
      name: "client-atlas-v1",
      partialize: (s) => ({ counts: s.counts }),
    },
  ),
);
