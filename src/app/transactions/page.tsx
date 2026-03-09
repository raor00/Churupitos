"use client";

import { useState, useMemo } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ArrowDownRight, ArrowUpRight, Plus, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ─── Filter types ────────────────────────────────────────────────────────────
type Period = "all" | "today" | "yesterday" | "7days" | "month" | "custom-month";
type TxType = "all" | "income" | "expense";

const PERIOD_LABELS: Record<Period, string> = {
    all: "Todo",
    today: "Hoy",
    yesterday: "Ayer",
    "7days": "7 días",
    month: "Este mes",
    "custom-month": "Mes",
};

function toDateOnly(d: Date) {
    return d.toISOString().slice(0, 10);
}

function getFilterDates(period: Period, customMonth: string): { from: string; to: string } | null {
    const now = new Date();
    if (period === "all") return null;

    if (period === "today") {
        const d = toDateOnly(now);
        return { from: d, to: d };
    }
    if (period === "yesterday") {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const d = toDateOnly(y);
        return { from: d, to: d };
    }
    if (period === "7days") {
        const from = new Date(now);
        from.setDate(from.getDate() - 6);
        return { from: toDateOnly(from), to: toDateOnly(now) };
    }
    if (period === "month") {
        const ym = now.toISOString().slice(0, 7);
        return { from: `${ym}-01`, to: toDateOnly(now) };
    }
    if (period === "custom-month" && customMonth) {
        const [y, m] = customMonth.split("-").map(Number);
        const last = new Date(y, m, 0).getDate();
        return { from: `${customMonth}-01`, to: `${customMonth}-${String(last).padStart(2, "0")}` };
    }
    return null;
}

// ─── Month navigation helpers ────────────────────────────────────────────────
function prevMonth(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function nextMonth(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("es-VE", { month: "long", year: "numeric" });
}

export default function TransactionsListPage() {
    const { transactions, categories } = useCurrentUser();

    const [period, setPeriod] = useState<Period>("month");
    const [txType, setTxType] = useState<TxType>("all");
    const [customMonth, setCustomMonth] = useState(() => new Date().toISOString().slice(0, 7));

    const getCategoryName = (id: string) => categories.find((c: any) => c.id === id)?.name ?? "—";

    // ── Filter logic ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const range = getFilterDates(period, customMonth);
        return transactions.filter((tx: any) => {
            if (txType !== "all" && tx.type !== txType) return false;
            if (!range) return true;
            return tx.date >= range.from && tx.date <= range.to;
        });
    }, [transactions, period, txType, customMonth]);

    // ── Summary for filtered set ─────────────────────────────────────────────
    const totalIncome = filtered
        .filter((tx: any) => tx.type === "income")
        .reduce((s: number, tx: any) => s + tx.amount, 0);
    const totalExpense = filtered
        .filter((tx: any) => tx.type === "expense")
        .reduce((s: number, tx: any) => s + tx.amount, 0);

    // ── Group by date ────────────────────────────────────────────────────────
    const grouped = useMemo(() => {
        const map = new Map<string, typeof filtered>();
        for (const tx of filtered) {
            const key = tx.date as string;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(tx);
        }
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filtered]);

    const periods: Period[] = ["all", "today", "yesterday", "7days", "month", "custom-month"];

    return (
        <div className="pb-safe pt-4 space-y-4">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">Historial</p>
                    <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold">Movimientos</h1>
                </div>
                <Link
                    href="/transactions/new"
                    className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                </Link>
            </header>

            {/* Period filter chips */}
            <div className="flex overflow-x-auto gap-2 pb-1 -mx-1 px-1 scrollbar-none">
                {periods.map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cn(
                            "flex-shrink-0 px-3 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider transition-all",
                            period === p
                                ? "bg-foreground text-background shadow-sm"
                                : "bg-white border border-black/10 text-muted-foreground hover:bg-black/5"
                        )}
                    >
                        {PERIOD_LABELS[p]}
                    </button>
                ))}
            </div>

            {/* Month navigator — only when custom-month selected */}
            <AnimatePresence>
                {period === "custom-month" && (
                    <motion.div
                        key="month-nav"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center justify-between bg-white border border-black/10 rounded-2xl px-4 py-3 shadow-sm">
                            <button
                                onClick={() => setCustomMonth(prev => prevMonth(prev))}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <p className="font-mono font-bold text-sm uppercase tracking-tight capitalize">
                                {monthLabel(customMonth)}
                            </p>
                            <button
                                onClick={() => setCustomMonth(prev => nextMonth(prev))}
                                disabled={customMonth >= new Date().toISOString().slice(0, 7)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors disabled:opacity-30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Type filter + summary row */}
            <div className="flex items-center justify-between gap-3">
                {/* Income/Expense toggle */}
                <div className="flex bg-black/5 rounded-full p-0.5 border border-black/5">
                    {(["all", "income", "expense"] as TxType[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTxType(t)}
                            className={cn(
                                "px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-widest transition-all",
                                txType === t
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground"
                            )}
                        >
                            {t === "all" ? "Todo" : t === "income" ? "Ingresos" : "Gastos"}
                        </button>
                    ))}
                </div>

                {/* Mini summary */}
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                    {txType !== "expense" && (
                        <span className="text-green-600 font-bold">
                            +${totalIncome.toFixed(0)}
                        </span>
                    )}
                    {txType !== "income" && (
                        <span className="text-foreground font-bold">
                            -${totalExpense.toFixed(0)}
                        </span>
                    )}
                </div>
            </div>

            {/* Transaction list grouped by date */}
            <div className="space-y-5">
                {grouped.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-14 space-y-3"
                    >
                        <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center">
                            <SlidersHorizontal className="w-6 h-6 text-muted-foreground opacity-40" />
                        </div>
                        <p className="font-mono text-sm uppercase font-bold text-muted-foreground opacity-40 tracking-tight">
                            Sin movimientos
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground opacity-30 text-center">
                            No hay registros para este período
                        </p>
                    </motion.div>
                ) : (
                    grouped.map(([date, txs]) => {
                        const dateLabel = (() => {
                            const today = toDateOnly(new Date());
                            const yesterday = toDateOnly(new Date(Date.now() - 864e5));
                            if (date === today) return "Hoy";
                            if (date === yesterday) return "Ayer";
                            return new Date(date + "T12:00:00").toLocaleDateString("es-VE", {
                                weekday: "long", day: "numeric", month: "short",
                            });
                        })();

                        const dayIncome = txs.filter((tx: any) => tx.type === "income").reduce((s: number, tx: any) => s + tx.amount, 0);
                        const dayExpense = txs.filter((tx: any) => tx.type === "expense").reduce((s: number, tx: any) => s + tx.amount, 0);

                        return (
                            <div key={date}>
                                {/* Day header */}
                                <div className="flex items-center justify-between mb-2 px-0.5">
                                    <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest capitalize font-bold">
                                        {dateLabel}
                                    </p>
                                    <div className="flex items-center space-x-2 text-[10px] font-mono">
                                        {dayIncome > 0 && <span className="text-green-600 font-bold">+${dayIncome.toFixed(2)}</span>}
                                        {dayExpense > 0 && <span className="text-muted-foreground font-bold">-${dayExpense.toFixed(2)}</span>}
                                    </div>
                                </div>

                                {/* Transactions for this day */}
                                <div className="space-y-2">
                                    {(txs as any[]).map((tx) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="paper-card p-4 rounded-xl flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
                                        >
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <div className={cn(
                                                    "w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border",
                                                    tx.type === "income"
                                                        ? "bg-success/5 border-success/20 text-success"
                                                        : "bg-error/5 border-error/20 text-error"
                                                )}>
                                                    {tx.type === "income"
                                                        ? <ArrowDownRight className="w-5 h-5" />
                                                        : <ArrowUpRight className="w-5 h-5" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-mono font-bold tracking-tight text-sm truncate">{tx.description}</p>
                                                    <p className="font-mono text-[10px] text-muted-foreground uppercase mt-0.5 truncate">
                                                        {getCategoryName(tx.category_id)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "font-mono font-bold tracking-tighter text-right flex-shrink-0 ml-3",
                                                tx.type === "income" ? "text-success" : "text-foreground"
                                            )}>
                                                {tx.type === "income" ? "+" : "-"}
                                                {tx.currency === "USD" || tx.currency === "USDT" ? "$" : tx.currency === "VES" ? "Bs." : "€"}
                                                {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
