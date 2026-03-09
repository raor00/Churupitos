import { create } from "zustand";

interface RatesState {
    bcv: number;       // BCV USD/VES
    usdt: number;      // USDT/VES (paralelo)
    euro: number;      // BCV EUR/VES
    preferredRate: "bcv" | "usdt";
    lastUpdated: string | null;
    isFetching: boolean;
    setRates: (rates: Partial<Pick<RatesState, "bcv" | "usdt" | "euro">>) => void;
    setPreferredRate: (rate: "bcv" | "usdt") => void;
    fetchRates: () => Promise<void>;
}

export const useRatesStore = create<RatesState>((set) => ({
    bcv: 0,
    usdt: 0,
    euro: 0,
    preferredRate: "usdt",
    lastUpdated: null,
    isFetching: false,

    setRates: (rates) =>
        set((state) => ({ ...state, ...rates, lastUpdated: new Date().toISOString() })),

    setPreferredRate: (rate) => set({ preferredRate: rate }),

    fetchRates: async () => {
        set({ isFetching: true });
        try {
            const [usdRes, eurRes] = await Promise.all([
                fetch("https://pydolarve.org/api/v2/dollar?page=alcambio", { cache: "no-store" }),
                fetch("https://pydolarve.org/api/v2/euro?page=alcambio", { cache: "no-store" }),
            ]);

            if (!usdRes.ok || !eurRes.ok) throw new Error("Fetch failed");

            const usdData = await usdRes.json();
            const eurData = await eurRes.json();

            // pydolarve returns monitors: { bcv: { price }, usd: { price }, ... }
            const bcv = usdData?.monitors?.bcv?.price ?? 0;
            const usdt = usdData?.monitors?.usd?.price ?? usdData?.monitors?.enparalelovzla?.price ?? 0;
            const euro = eurData?.monitors?.bcv?.price ?? 0;

            set({
                bcv,
                usdt,
                euro,
                lastUpdated: new Date().toISOString(),
                isFetching: false,
            });
        } catch {
            set({ isFetching: false });
        }
    },
}));

/** Returns the active VES/USD rate based on user preference */
export function getRate(state: RatesState): number {
    const rate = state.preferredRate === "bcv" ? state.bcv : state.usdt;
    // Fallback to non-zero rate if preferred is 0 (still loading)
    return rate > 0 ? rate : (state.usdt > 0 ? state.usdt : state.bcv);
}
