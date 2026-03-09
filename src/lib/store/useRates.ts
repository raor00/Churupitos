import { create } from "zustand";

interface RatesState {
    bcv: number;
    paralelo: number;
    usdt: number;
    preferredRate: "bcv" | "paralelo";
    lastUpdated: string | null;
    setRates: (rates: Partial<Pick<RatesState, "bcv" | "paralelo" | "usdt">>) => void;
    setPreferredRate: (rate: "bcv" | "paralelo") => void;
}

export const useRatesStore = create<RatesState>((set) => ({
    bcv: 433.17,
    paralelo: 603.17,
    usdt: 603.17,
    preferredRate: "paralelo",
    lastUpdated: null,
    setRates: (rates) => set((state) => ({ ...state, ...rates, lastUpdated: new Date().toISOString() })),
    setPreferredRate: (rate) => set({ preferredRate: rate }),
}));

/** Returns the active VES/USD rate based on user preference */
export function getRate(state: RatesState): number {
    return state.preferredRate === "bcv" ? state.bcv : state.paralelo;
}
