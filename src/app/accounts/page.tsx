"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { Plus, Wallet, Landmark, CreditCard, Send, Banknote, TrendingUp, ArrowUpRight, DollarSign } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const ICON_MAP: Record<string, React.ElementType> = {
    Wallet,
    Landmark,
    CreditCard,
    Send,
    Banknote,
};

const CURRENCY_LABEL: Record<string, string> = {
    USD: "$",
    USDT: "$",
    VES: "Bs.",
    EUR: "€",
};

export default function AccountsPage() {
    const { accounts } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const [showAll, setShowAll] = useState(false);

    const toUSD = (amount: number, currency: string) => {
        if (currency === "USD" || currency === "USDT") return amount;
        if (currency === "VES") return amount / rate;
        if (currency === "EUR") return amount * 1.08; // rough EUR→USD
        return amount;
    };

    const totalUSD = accounts.reduce((sum, acc) => sum + toUSD(acc.balance, acc.currency), 0);
    const totalVES = totalUSD * rate;

    const visibleAccounts = showAll ? accounts : accounts.slice(0, 4);

    return (
        <div className="pb-28 pt-4 space-y-6">
            {/* Header */}
            <header className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">
                        Portafolio
                    </p>
                    <h1 className="text-2xl font-mono tracking-tighter font-bold uppercase">
                        Mis Saldos
                    </h1>
                </div>
                <Link
                    href="/accounts/new"
                    className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                </Link>
            </header>

            {/* Total Balance Hero */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="paper-card rounded-2xl p-6 relative overflow-hidden"
            >
                {/* Subtle grain */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-black/5 border border-black/10 flex items-center justify-center">
                                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                                Total estimado
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                            <TrendingUp className="w-3 h-3 text-success" />
                            <span className="text-[10px] font-mono text-success font-bold">+0%</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-baseline space-x-1.5">
                            <span className="text-2xl font-mono text-muted-foreground">$</span>
                            <span className="text-4xl font-mono font-bold tracking-tighter">
                                {totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">
                            ≈ Bs.{" "}
                            <span className="font-bold">
                                {totalVES.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="opacity-50 ml-1">(tasa Bs.{rate.toFixed(2)}/$)</span>
                        </p>
                    </div>

                    {/* Breakdown mini-bar */}
                    <div className="mt-5 space-y-1.5">
                        {accounts.map((acc) => {
                            const usdVal = toUSD(acc.balance, acc.currency);
                            const pct = totalUSD > 0 ? (usdVal / totalUSD) * 100 : 0;
                            return (
                                <div key={acc.id} className="flex items-center space-x-2">
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: acc.color || "#111",
                                            minWidth: 4,
                                        }}
                                    />
                                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-tight">
                                        {acc.name} · {pct.toFixed(0)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* Accounts List */}
            <div>
                <h2 className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-3">
                    Cuentas ({accounts.length})
                </h2>

                <div className="space-y-3">
                    <AnimatePresence>
                        {visibleAccounts.map((acc, i) => {
                            const IconComponent = acc.icon && ICON_MAP[acc.icon] ? ICON_MAP[acc.icon] : Wallet;
                            const usdEquiv = toUSD(acc.balance, acc.currency);
                            const symbol = CURRENCY_LABEL[acc.currency] ?? "$";
                            const showConversion = acc.currency === "VES";

                            return (
                                <motion.div
                                    key={acc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.3 }}
                                    className="paper-card p-4 rounded-xl group relative overflow-hidden"
                                >
                                    {/* Left color accent */}
                                    <div
                                        className="absolute top-0 left-0 bottom-0 w-1 rounded-l-xl"
                                        style={{ backgroundColor: acc.color || "#111" }}
                                    />

                                    <div className="pl-3 flex items-center justify-between">
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <div
                                                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                                                style={{
                                                    backgroundColor: `${acc.color || "#111"}18`,
                                                    color: acc.color || "#111",
                                                }}
                                            >
                                                <IconComponent className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-mono font-bold uppercase tracking-tight text-sm truncate">
                                                    {acc.name}
                                                </h3>
                                                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                                    {acc.provider || "Cuenta"}
                                                    {" · "}
                                                    <span
                                                        className="px-1 py-0.5 rounded text-[9px] font-bold uppercase"
                                                        style={{
                                                            backgroundColor: `${acc.color || "#111"}18`,
                                                            color: acc.color || "#111",
                                                        }}
                                                    >
                                                        {acc.currency}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0 ml-3">
                                            <p className="font-mono font-bold tracking-tighter text-base">
                                                {symbol}
                                                {acc.balance.toLocaleString("en-US", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                            {showConversion ? (
                                                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                                    ≈ ${usdEquiv.toFixed(2)}
                                                </p>
                                            ) : (
                                                <p className="font-mono text-[10px] text-muted-foreground mt-0.5 flex items-center justify-end space-x-0.5">
                                                    <ArrowUpRight className="w-2.5 h-2.5" />
                                                    <span>USD</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {accounts.length > 4 && (
                    <button
                        onClick={() => setShowAll(v => !v)}
                        className="w-full mt-3 py-2.5 rounded-xl border border-black/10 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:bg-black/5 transition-colors"
                    >
                        {showAll ? "Ver menos" : `Ver ${accounts.length - 4} más`}
                    </button>
                )}

                {accounts.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-14 space-y-3"
                    >
                        <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center mx-auto">
                            <Wallet className="w-6 h-6 text-muted-foreground opacity-50" />
                        </div>
                        <p className="font-mono text-sm text-muted-foreground uppercase opacity-50">
                            Sin cuentas registradas
                        </p>
                        <Link
                            href="/accounts/new"
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar cuenta</span>
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
