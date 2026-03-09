"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Activity } from "lucide-react";

// In a real app, this would use SWR or React Query to pull from the API proxy
export function RatesWidget() {
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState({ bcv: 0, paralelo: 0 });

    useEffect(() => {
        // Simulated fetch
        const fetchRates = async () => {
            setLoading(true);
            await new Promise(r => setTimeout(r, 800)); // Simulate network
            setRates({ bcv: 433.17, paralelo: 603.17 });
            setLoading(false);
        };
        fetchRates();
    }, []);

    const differential = rates.bcv ? ((rates.paralelo - rates.bcv) / rates.bcv) * 100 : 0;
    const isHighVolatility = differential > 30;

    return (
        <div className="paper-card p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-2">
                <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-xs font-mono tracking-tight text-muted-foreground uppercase">
                        Tasas de Cambio (Bs/$)
                    </h3>
                </div>
                <button
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                        setLoading(true);
                        setTimeout(() => setLoading(false), 500);
                    }}
                >
                    <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Official BCV</p>
                    <div className="flex items-baseline space-x-1">
                        <span className="text-sm font-mono text-muted-foreground">Bs.</span>
                        {loading ? (
                            <span className="h-6 w-16 bg-black/5 rounded animate-pulse inline-block" />
                        ) : (
                            <span className="text-xl font-mono font-bold tracking-tighter">
                                {rates.bcv.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Parallel</p>
                    <div className="flex items-baseline space-x-1">
                        <span className="text-sm font-mono text-muted-foreground">Bs.</span>
                        {loading ? (
                            <span className="h-6 w-16 bg-black/5 rounded animate-pulse inline-block" />
                        ) : (
                            <span className="text-xl font-mono font-bold tracking-tighter">
                                {rates.paralelo.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {!loading && isHighVolatility && (
                <div className="mt-4 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                    </span>
                    <p className="text-[10px] font-mono text-warning-foreground uppercase tracking-tight">
                        High Volatility: {differential.toFixed(1)}% spread
                    </p>
                </div>
            )}
        </div>
    );
}
