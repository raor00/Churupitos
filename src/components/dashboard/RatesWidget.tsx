"use client";

import { useEffect } from "react";
import { RefreshCw, Activity } from "lucide-react";
import { useRatesStore } from "@/lib/store/useRates";

export function RatesWidget() {
    const { bcv, paralelo, preferredRate, setRates, setPreferredRate, lastUpdated } = useRatesStore();
    const loading = !lastUpdated;

    useEffect(() => {
        // Simulated fetch – replace with real API call
        const fetchRates = async () => {
            await new Promise(r => setTimeout(r, 800));
            setRates({ bcv: 433.17, paralelo: 603.17, usdt: 603.17 });
        };
        fetchRates();
    }, [setRates]);

    const differential = bcv ? ((paralelo - bcv) / bcv) * 100 : 0;
    const isHighVolatility = differential > 30;

    return (
        <div className="paper-card p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
                <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-xs font-mono tracking-tight text-muted-foreground uppercase">
                        Tasas Bs/$
                    </h3>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Preferred rate toggle */}
                    <div className="flex bg-black/5 rounded-full p-0.5 border border-black/5">
                        {(["bcv", "paralelo"] as const).map(r => (
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
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setRates({ bcv: 433.17, paralelo: 603.17 })}
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">BCV Oficial</p>
                    <div className="flex items-baseline space-x-1">
                        <span className="text-sm font-mono text-muted-foreground">Bs.</span>
                        {loading ? (
                            <span className="h-6 w-16 bg-black/5 rounded animate-pulse inline-block" />
                        ) : (
                            <span className="text-xl font-mono font-bold tracking-tighter">
                                {bcv.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">USDT</p>
                    <div className="flex items-baseline space-x-1">
                        <span className="text-sm font-mono text-muted-foreground">Bs.</span>
                        {loading ? (
                            <span className="h-6 w-16 bg-black/5 rounded animate-pulse inline-block" />
                        ) : (
                            <span className="text-xl font-mono font-bold tracking-tighter">
                                {paralelo.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {!loading && isHighVolatility && (
                <div className="mt-4 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-warning" />
                    </span>
                    <p className="text-[10px] font-mono text-warning-foreground uppercase tracking-tight">
                        Alta volatilidad: {differential.toFixed(1)}% spread
                    </p>
                </div>
            )}
        </div>
    );
}
