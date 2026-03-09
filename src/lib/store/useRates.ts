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

export const useRatesStore = create<RatesState>((set, get) => ({
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
            // ve.dolarapi.com — returns [{fuente, promedio, ...}]
            const [usdRes, eurRes] = await Promise.all([
                fetch("https://ve.dolarapi.com/v1/dolares", { cache: "no-store" }),
                fetch("https://ve.dolarapi.com/v1/euros", { cache: "no-store" }),
            ]);

            if (!usdRes.ok || !eurRes.ok) throw new Error("Fetch failed");

            const usdData: { fuente: string; promedio: number }[] = await usdRes.json();
            const eurData: { fuente: string; promedio: number }[] = await eurRes.json();

            const bcv = usdData.find(d => d.fuente === "oficial")?.promedio ?? 0;
            const usdt = usdData.find(d => d.fuente === "paralelo")?.promedio ?? 0;
            const euro = eurData.find(d => d.fuente === "oficial")?.promedio ?? 0;

            set({
                bcv,
                usdt,
                euro,
                lastUpdated: new Date().toISOString(),
                isFetching: false,
            });
        } catch {
            // Keep existing values; only set fallbacks on first load
            if (get().bcv === 0) {
                set({ isFetching: false, bcv: 433.17, usdt: 616.42, euro: 501.73 });
            } else {
                set({ isFetching: false });
            }
        }
    },
}));

/** Returns the active VES/USD rate based on user preference */
export function getRate(state: RatesState): number {
    const rate = state.preferredRate === "bcv" ? state.bcv : state.usdt;
    // Fallback to non-zero rate if preferred is 0 (still loading)
    return rate > 0 ? rate : (state.usdt > 0 ? state.usdt : state.bcv);
}
