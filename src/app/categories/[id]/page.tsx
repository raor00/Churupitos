"use client";

import { createElement, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, icons, type LucideIcon, Tag } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { getCategoryVisual } from "@/lib/categories/catalog";
import { cn } from "@/lib/utils";

const iconRegistry = icons as Record<string, LucideIcon>;
const resolveIcon = (name?: string): LucideIcon => (name ? (iconRegistry[name] ?? Tag) : Tag);

// ─── Month helpers ────────────────────────────────────────────────────────────
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
function formatDate(dateStr: string) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (dateStr === today) return "Hoy";
    if (dateStr === yesterday) return "Ayer";
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}
function currencyPrefix(curr: string) {
    if (curr === "USD" || curr === "USDT") return "$";
    if (curr === "VES") return "Bs.";
    if (curr === "EUR") return "€";
    return "$";
}

export default function CategoryDetailPage() {
    const params = useParams();
    const categoryId = params.id as string;
    const { transactions, categories } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [month, setMonth] = useState(currentMonth);

    const toUSD = (amount: number, curr: string) => {
        if (curr === "USD" || curr === "USDT") return amount;
        if (curr === "VES") return amount / rate;
        if (curr === "EUR") return amount * 1.08;
        return amount;
    };

    const category = categories.find((c: any) => c.id === categoryId);
    const visual = category ? getCategoryVisual(category) : { icon: "Tag", color: "#6D7588", name: "Categoría", type: "expense", order: 0 };

    const filtered = useMemo(() =>
        [...transactions]
            .filter((tx: any) => tx.category_id === categoryId && tx.date.startsWith(month))
            .sort((a: any, b: any) => b.date.localeCompare(a.date) || (b.created_at ?? "").localeCompare(a.created_at ?? "")),
        [transactions, categoryId, month]
    );

    const totalAmount = useMemo(() =>
        filtered.reduce((s: number, tx: any) => s + toUSD(tx.amount, tx.currency), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filtered, rate]
    );

    const txType = category?.type ?? "expense";
    const isIncome = txType === "income";

    // Group by date
    const grouped = useMemo(() => {
        const map = new Map<string, typeof filtered>();
        for (const tx of filtered) {
            if (!map.has(tx.date)) map.set(tx.date, []);
            map.get(tx.date)!.push(tx);
        }
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filtered]);

    return (
        <div className="pb-safe pt-4 space-y-4">
            {/* Back + header */}
            <header className="flex items-center gap-3">
                <Link
                    href="/categories"
                    className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex items-center gap-2.5 min-w-0">
                    <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${visual.color}20`, color: visual.color }}
                    >
                        {createElement(resolveIcon(visual.icon), { className: "w-4 h-4" })}
                    </span>
                    <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                            {isIncome ? "Ingreso" : "Gasto"}
                        </p>
                        <h1 className="text-xl font-mono tracking-tighter font-bold uppercase truncate">
                            {category?.name ?? "Categoría"}
                        </h1>
                    </div>
                </div>
            </header>

            {/* Month navigator */}
            <div className="flex items-center justify-between bg-white border border-black/8 rounded-2xl px-4 py-2.5 shadow-sm">
                <button
                    onClick={() => setMonth(prev => prevMonth(prev))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="font-mono font-bold text-sm uppercase tracking-tight capitalize">
                    {monthLabel(month)}
                </p>
                <button
                    onClick={() => setMonth(prev => nextMonth(prev))}
                    disabled={month >= currentMonth}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors disabled:opacity-30"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* KPI summary */}
            <div className="grid grid-cols-2 gap-2">
                <div className="paper-card rounded-xl p-3.5">
                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1">
                        {isIncome ? "Total ingresado" : "Total gastado"}
                    </p>
                    <p className={cn("font-mono font-bold text-xl tracking-tighter", isIncome ? "text-success" : "text-foreground")}>
                        {isIncome ? "+" : "-"}${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="paper-card rounded-xl p-3.5">
                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1">
                        Movimientos
                    </p>
                    <p className="font-mono font-bold text-xl tracking-tighter">
                        {filtered.length}
                        <span className="text-xs text-muted-foreground font-normal ml-1">transacciones</span>
                    </p>
                </div>
            </div>

            {/* Transaction list */}
            <div className="space-y-4">
                {grouped.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-14 space-y-3"
                    >
                        <div className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center">
                            {createElement(resolveIcon(visual.icon), { className: "w-6 h-6 text-muted-foreground opacity-30" })}
                        </div>
                        <p className="font-mono text-sm uppercase font-bold text-muted-foreground opacity-40 tracking-tight">
                            Sin movimientos
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground opacity-30 text-center">
                            No hay registros en este período
                        </p>
                    </motion.div>
                ) : (
                    grouped.map(([date, txs]) => {
                        const dayTotal = txs.reduce((s: number, tx: any) => s + toUSD(tx.amount, tx.currency), 0);
                        return (
                            <div key={date}>
                                <div className="flex items-center justify-between mb-2 px-0.5">
                                    <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest capitalize font-bold">
                                        {formatDate(date)}
                                    </p>
                                    <span className={cn("font-mono text-[10px] font-bold", isIncome ? "text-success" : "text-muted-foreground")}>
                                        {isIncome ? "+" : "-"}${dayTotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {(txs as any[]).map((tx) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="paper-card p-3.5 rounded-xl flex items-center justify-between"
                                        >
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <div className={cn(
                                                    "w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center border",
                                                    tx.type === "income"
                                                        ? "bg-success/5 border-success/20 text-success"
                                                        : "bg-error/5 border-error/20 text-error"
                                                )}>
                                                    {tx.type === "income"
                                                        ? <ArrowDownRight className="w-4 h-4" />
                                                        : <ArrowUpRight className="w-4 h-4" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-mono font-bold tracking-tight text-sm truncate">
                                                        {tx.description}
                                                    </p>
                                                    {tx.notes && (
                                                        <p className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">
                                                            {tx.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "font-mono font-bold tracking-tighter text-right flex-shrink-0 ml-3 text-sm",
                                                tx.type === "income" ? "text-success" : "text-foreground"
                                            )}>
                                                {tx.type === "income" ? "+" : "-"}
                                                {currencyPrefix(tx.currency)}
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
