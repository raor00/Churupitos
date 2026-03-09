"use client";

import { useEffect } from "react";
import { RefreshCw, Activity } from "lucide-react";
import { useRatesStore } from "@/lib/store/useRates";

export function RatesWidget() {
    const { bcv, usdt, euro, preferredRate, setPreferredRate, fetchRates, lastUpdated, isFetching } = useRatesStore();
    const loading = !lastUpdated;

    // Fetch on mount, then auto-refresh every 5 minutes
    useEffect(() => {
        fetchRates();
        const interval = setInterval(fetchRates, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchRates]);

    const formatRate = (val: number) =>
        val > 0 ? val.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

    const lastUpdatedLabel = lastUpdated
        ? new Date(lastUpdated).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
        : null;

    return (
        <div className="paper-card p-4 rounded-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
                <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                        <h3 className="text-xs font-mono tracking-tight text-muted-foreground uppercase">
                            Tasas Bs.
                        </h3>
                        {lastUpdatedLabel && (
                            <p className="text-[9px] font-mono text-muted-foreground/50">
                                Act. {lastUpdatedLabel}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Toggle BCV / USDT — affects which rate is used in the app */}
                    <div className="flex bg-black/5 rounded-full p-0.5 border border-black/5">
                        {(["bcv", "usdt"] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setPreferredRate(r)}
                                className={`px-2 py-0.5 rounded-full font-mono text-[9px] uppercase font-bold transition-all ${
                                    preferredRate === r
                                        ? "bg-foreground text-background shadow-sm"
                                        : "text-muted-foreground"
                                }`}
                            >
                                {r === "bcv" ? "BCV" : "USDT"}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchRates}
                        disabled={isFetching}
                        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                    >
                        <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* 3 rates */}
            <div className="grid grid-cols-3 gap-3">
                {/* BCV USD */}
                <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1 tracking-wide">BCV $</p>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">Bs.</span>
                        {loading ? (
                            <span className="h-5 w-12 bg-black/5 rounded animate-pulse inline-block" />
                        ) : (
                            <span className={`text-base font-mono font-bold tracking-tighter ${preferredRate === "bcv" ? "text-foreground" : "text-muted-foreground"}`}>
                                {formatRate(bcv)}
                            </span>
                        )}
                    </div>
                </div>

                {/* BCV EUR */}
                <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1 tracking-wide">BCV €</p>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">Bs.</span>
                        {loading ? (
                            <span className="h-5 w-12 bg-black/5 rounded animate-pulse inline-block" />
                        ) : (
                            <span className="text-base font-mono font-bold tracking-tighter text-muted-foreground">
                                {formatRate(euro)}
                            </span>
                        )}
                    </div>
                </div>

                {/* USDT */}
                <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1 tracking-wide">USDT</p>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">Bs.</span>
                        {loading ? (
                            <span className="h-5 w-12 bg-black/5 rounded animate-pulse inline-block" />
                        ) : (
                            <span className={`text-base font-mono font-bold tracking-tighter ${preferredRate === "usdt" ? "text-foreground" : "text-muted-foreground"}`}>
                                {formatRate(usdt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Active rate label */}
            {!loading && (
                <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mt-3">
                    Tasa activa: {preferredRate === "bcv" ? `BCV · Bs. ${formatRate(bcv)}` : `USDT · Bs. ${formatRate(usdt)}`}
                </p>
            )}
        </div>
    );
}
