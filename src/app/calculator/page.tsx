"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

export default function CalculatorPage() {
    const [amount, setAmount] = useState<string>("");
    const [fromCurrency, setFromCurrency] = useState<"USD" | "VES">("USD");
    const [isBcv, setIsBcv] = useState(true); // Toggle between BCV and Paralelo

    // Mock rates (would be fetched from useRates hook in reality)
    const rates = { bcv: 433.17, paralelo: 603.17 };
    const currentRate = isBcv ? rates.bcv : rates.paralelo;

    const handleSwap = () => {
        setFromCurrency(prev => prev === "USD" ? "VES" : "USD");
        setAmount("");
    };

    const calculateResult = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return "0.00";

        if (fromCurrency === "USD") {
            return (numAmount * currentRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            return (numAmount / currentRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    };

    return (
        <div className="pb-24 pt-4 space-y-8">
            <header>
                <h1 className="text-xl font-mono tracking-tighter uppercase font-bold text-center">
                    Exchange Calculator
                </h1>
                <p className="text-muted-foreground font-mono text-xs mt-1 text-center">
                    Real-time VES conversion
                </p>
            </header>

            {/* Rate Source Toggle */}
            <div className="flex justify-center">
                <div className="bg-black/5 p-1 rounded-full inline-flex">
                    <button
                        onClick={() => setIsBcv(true)}
                        className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all ${isBcv ? "bg-white shadow-sm border border-black/10" : "text-muted-foreground opacity-70"
                            }`}
                    >
                        BCV ({rates.bcv})
                    </button>
                    <button
                        onClick={() => setIsBcv(false)}
                        className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all ${!isBcv ? "bg-white shadow-sm border border-black/10 text-error" : "text-muted-foreground opacity-70"
                            }`}
                    >
                        PARALELO ({rates.paralelo})
                    </button>
                </div>
            </div>

            <div className="paper-card p-6 rounded-3xl relative overflow-hidden max-w-sm mx-auto shadow-xl border-black/5">

                {/* Input Region */}
                <div className="mb-8 relative">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground absolute -top-5 left-0">
                        You Send
                    </label>
                    <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                        <span className="text-2xl font-mono font-bold">{fromCurrency === "USD" ? "$" : "Bs."}</span>
                        <input
                            type="number"
                            className="bg-transparent text-right text-4xl font-mono font-bold outline-none w-full ml-2 placeholder:text-black/10"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>

                {/* Swap Button Region */}
                <div className="flex justify-center absolute left-0 right-0 top-1/2 -translate-y-[60%] z-20">
                    <button
                        onClick={handleSwap}
                        className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform border-4 border-white"
                    >
                        <ArrowUpDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Output Region */}
                <div className="mt-12 relative">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground absolute -top-5 left-0">
                        You Get
                    </label>
                    <div className="flex items-center justify-between border-b-2 border-transparent pb-2 mt-4 bg-black/5 p-4 rounded-xl">
                        <span className="text-xl font-mono font-bold text-muted-foreground">
                            {fromCurrency === "USD" ? "Bs." : "$"}
                        </span>
                        <span className="text-3xl font-mono font-bold tracking-tighter text-right w-full overflow-hidden text-ellipsis ml-2">
                            {calculateResult()}
                        </span>
                    </div>
                </div>

            </div>

            {/* Typewriter Aesthetic details */}
            <div className="text-center mt-8">
                <p className="font-mono text-[9px] text-muted-foreground uppercase opacity-50 tracking-widen">
                    * Calculation based on {isBcv ? "Official BCV" : "Parallel"} rate.
                </p>
            </div>

        </div>
    );
}
