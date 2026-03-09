"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, RefreshCw } from "lucide-react";
import { useRatesStore } from "@/lib/store/useRates";

type RateMode = "bcv" | "usdt";
type Currency = "USD" | "VES" | "EUR";

export default function CalculatorPage() {
    const { bcv, usdt, euro, fetchRates, lastUpdated, isFetching } = useRatesStore();
    const [amount, setAmount] = useState<string>("");
    const [fromCurrency, setFromCurrency] = useState<Currency>("USD");
    const [rateMode, setRateMode] = useState<RateMode>("usdt");

    useEffect(() => {
        if (!lastUpdated) fetchRates();
    }, [fetchRates, lastUpdated]);

    const currentRate = rateMode === "bcv" ? bcv : usdt;
    const currentEuro = euro;

    const handleSwap = () => {
        if (fromCurrency === "USD") setFromCurrency("VES");
        else if (fromCurrency === "VES") setFromCurrency("USD");
        setAmount("");
    };

    const calculateResult = (): string => {
        const n = parseFloat(amount);
        if (isNaN(n) || n === 0) return "0.00";
        if (fromCurrency === "USD") {
            return (n * currentRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            return (n / currentRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    };

    const toCurrency = fromCurrency === "USD" ? "VES" : "USD";
    const toPrefix = toCurrency === "VES" ? "Bs." : "$";
    const fromPrefix = fromCurrency === "VES" ? "Bs." : fromCurrency === "EUR" ? "€" : "$";

    const lastUpdatedLabel = lastUpdated
        ? new Date(lastUpdated).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
        : null;

    const formatRate = (val: number) =>
        val > 0 ? val.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "...";

    return (
        <div className="pb-24 pt-4 space-y-6">
            <header className="text-center">
                <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">Herramienta</p>
                <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold">Calculadora</h1>
            </header>

            {/* Rates summary card */}
            <div className="paper-card rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground tracking-widest">Tasas actuales</p>
                    <div className="flex items-center gap-2">
                        {lastUpdatedLabel && (
                            <span className="text-[9px] font-mono text-muted-foreground/40">Act. {lastUpdatedLabel}</span>
                        )}
                        <button onClick={fetchRates} disabled={isFetching} className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
                            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">BCV $</p>
                        <p className="font-mono font-bold text-sm tracking-tighter">{formatRate(bcv)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">BCV €</p>
                        <p className="font-mono font-bold text-sm tracking-tighter">{formatRate(currentEuro)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">USDT</p>
                        <p className="font-mono font-bold text-sm tracking-tighter">{formatRate(usdt)}</p>
                    </div>
                </div>
            </div>

            {/* Rate mode toggle */}
            <div className="flex justify-center">
                <div className="bg-black/5 p-0.5 rounded-full inline-flex border border-black/5">
                    {(["bcv", "usdt"] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRateMode(r)}
                            className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all ${
                                rateMode === r
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {r === "bcv" ? `BCV · ${formatRate(bcv)}` : `USDT · ${formatRate(usdt)}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Converter card */}
            <div className="paper-card p-6 rounded-3xl relative overflow-hidden max-w-sm mx-auto shadow-xl border-black/5">
                {/* From */}
                <div className="mb-8 relative">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground absolute -top-5 left-0">
                        Envías
                    </label>
                    <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                        <span className="text-2xl font-mono font-bold">{fromPrefix}</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            className="bg-transparent text-right text-4xl font-mono font-bold outline-none w-full ml-2 placeholder:text-black/10"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <p className="text-[9px] font-mono text-muted-foreground mt-1">{fromCurrency}</p>
                </div>

                {/* Swap button */}
                <div className="flex justify-center absolute left-0 right-0 top-1/2 -translate-y-[60%] z-20">
                    <button
                        onClick={handleSwap}
                        className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-4 border-white"
                    >
                        <ArrowUpDown className="w-5 h-5" />
                    </button>
                </div>

                {/* To */}
                <div className="mt-12 relative">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground absolute -top-5 left-0">
                        Recibes
                    </label>
                    <div className="flex items-center justify-between pb-2 mt-4 bg-black/5 p-4 rounded-xl">
                        <span className="text-xl font-mono font-bold text-muted-foreground">{toPrefix}</span>
                        <span className="text-3xl font-mono font-bold tracking-tighter text-right w-full overflow-hidden text-ellipsis ml-2">
                            {calculateResult()}
                        </span>
                    </div>
                    <p className="text-[9px] font-mono text-muted-foreground mt-1 text-right">{toCurrency}</p>
                </div>
            </div>

            <p className="text-center font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest">
                Usando tasa {rateMode === "bcv" ? "BCV oficial" : "USDT"} · Bs. {formatRate(currentRate)}
            </p>
        </div>
    );
}
