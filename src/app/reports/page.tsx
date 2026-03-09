"use client";

import { useMemo, useState, createElement } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { getCategoryVisual } from "@/lib/categories/catalog";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    LineChart, Line, CartesianGrid, PieChart, Pie, RadialBarChart, RadialBar,
    ReferenceLine,
} from "recharts";
import {
    ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
    ArrowUpRight, ArrowDownRight, BarChart2, PieChart as PieIcon,
    Activity, Zap, Target, icons, type LucideIcon, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const iconRegistry = icons as Record<string, LucideIcon>;
const resolveIcon = (name?: string): LucideIcon => (name ? (iconRegistry[name] ?? Tag) : Tag);

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
function monthLabel(ym: string, short = false) {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("es-VE", {
        month: short ? "short" : "long",
        year: short ? "2-digit" : "numeric",
    });
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── Tooltips ─────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 border border-black/10 rounded-xl px-3 py-2 shadow-lg font-mono text-[11px] min-w-[110px]">
            <p className="text-muted-foreground uppercase tracking-widest text-[9px] mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} className="font-bold" style={{ color: p.color ?? p.fill }}>
                    {p.dataKey === "income" ? "+" : p.dataKey === "expense" ? "-" : ""}
                    ${Number(p.value).toFixed(2)}
                </p>
            ))}
        </div>
    );
}

type Tab = "resumen" | "gastos" | "ingresos" | "tendencia";

const TABS: { id: Tab; label: string; icon: typeof BarChart2 }[] = [
    { id: "resumen", label: "Resumen", icon: Activity },
    { id: "gastos", label: "Gastos", icon: ArrowUpRight },
    { id: "ingresos", label: "Ingresos", icon: ArrowDownRight },
    { id: "tendencia", label: "Tendencia", icon: TrendingUp },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StatsPage() {
    const { transactions, categories } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const [tab, setTab] = useState<Tab>("resumen");
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const currentMonth = new Date().toISOString().slice(0, 7);

    const toUSD = (amount: number, curr: string) => {
        if (curr === "USD" || curr === "USDT") return amount;
        if (curr === "VES") return amount / rate;
        if (curr === "EUR") return amount * 1.08;
        return amount;
    };

    // ── Month transactions ────────────────────────────────────────────────
    const monthTxs = useMemo(() =>
        transactions.filter(tx => tx.date.startsWith(month)),
        [transactions, month]
    );

    const income = useMemo(() =>
        monthTxs.filter(t => t.type === "income").reduce((s, t) => s + toUSD(t.amount, t.currency), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [monthTxs, rate]
    );
    const expense = useMemo(() =>
        monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + toUSD(t.amount, t.currency), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [monthTxs, rate]
    );
    const net = income - expense;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

    // ── Prev month for delta ──────────────────────────────────────────────
    const prevM = prevMonth(month);
    const prevTxs = useMemo(() =>
        transactions.filter(tx => tx.date.startsWith(prevM)),
        [transactions, prevM]
    );
    const prevExpense = useMemo(() =>
        prevTxs.filter(t => t.type === "expense").reduce((s, t) => s + toUSD(t.amount, t.currency), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [prevTxs, rate]
    );
    const expenseDelta = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

    // ── Top expense categories ────────────────────────────────────────────
    const topExpenseCategories = useMemo(() => {
        const map = new Map<string, number>();
        monthTxs.filter(t => t.type === "expense").forEach(t => {
            map.set(t.category_id, (map.get(t.category_id) ?? 0) + toUSD(t.amount, t.currency));
        });
        const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([id, amount]) => {
                const cat = categories.find(c => c.id === id);
                const visual = cat ? getCategoryVisual(cat) : { icon: "Tag", color: "#999", name: "Sin categoría", type: "expense", order: 0 };
                return { id, name: cat?.name ?? "Sin categoría", amount, pct: total > 0 ? (amount / total) * 100 : 0, color: visual.color, icon: visual.icon };
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthTxs, categories, rate]);

    // ── Top income categories ─────────────────────────────────────────────
    const topIncomeCategories = useMemo(() => {
        const map = new Map<string, number>();
        monthTxs.filter(t => t.type === "income").forEach(t => {
            map.set(t.category_id, (map.get(t.category_id) ?? 0) + toUSD(t.amount, t.currency));
        });
        const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([id, amount]) => {
                const cat = categories.find(c => c.id === id);
                const visual = cat ? getCategoryVisual(cat) : { icon: "Tag", color: "#999", name: "Sin categoría", type: "income", order: 0 };
                return { id, name: cat?.name ?? "Sin categoría", amount, pct: total > 0 ? (amount / total) * 100 : 0, color: visual.color, icon: visual.icon };
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthTxs, categories, rate]);

    // ── Daily bars for selected month ─────────────────────────────────────
    const dailyData = useMemo(() => {
        const [y, m] = month.split("-").map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = String(i + 1).padStart(2, "0");
            const dateStr = `${month}-${day}`;
            const txs = transactions.filter(tx => tx.date === dateStr);
            const inc = txs.filter(t => t.type === "income").reduce((s, t) => s + toUSD(t.amount, t.currency), 0);
            const exp = txs.filter(t => t.type === "expense").reduce((s, t) => s + toUSD(t.amount, t.currency), 0);
            return { name: String(i + 1), income: inc, expense: exp };
        }).filter(d => d.income > 0 || d.expense > 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, month, rate]);

    // ── 6-month trend ─────────────────────────────────────────────────────
    const trendData = useMemo(() => {
        const months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
        return months.map(ym => {
            const txs = transactions.filter(tx => tx.date.startsWith(ym));
            const inc = txs.filter(t => t.type === "income").reduce((s, t) => s + toUSD(t.amount, t.currency), 0);
            const exp = txs.filter(t => t.type === "expense").reduce((s, t) => s + toUSD(t.amount, t.currency), 0);
            return { name: monthLabel(ym, true), income: inc, expense: exp, net: inc - exp };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, rate]);

    // ── Pie data ──────────────────────────────────────────────────────────
    const pieData = topExpenseCategories.map(c => ({ name: c.name, value: c.amount, fill: c.color }));

    // ── Biggest single expense ────────────────────────────────────────────
    const biggestExpense = useMemo(() =>
        monthTxs.filter(t => t.type === "expense").sort((a, b) => toUSD(b.amount, b.currency) - toUSD(a.amount, a.currency))[0],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [monthTxs, rate]
    );

    // ── Tx count ──────────────────────────────────────────────────────────
    const txCount = monthTxs.length;

    const NetIcon = net >= 0 ? TrendingUp : TrendingDown;
    const netColor = net >= 0 ? "text-success" : "text-error";

    return (
        <div className="pb-safe pt-4 space-y-5">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">Análisis</p>
                    <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold">Estadísticas</h1>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMonth(p => prevMonth(p))}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <p className="font-mono font-bold text-xs uppercase tracking-tight w-24 text-center">
                        {capitalize(monthLabel(month, true))}
                    </p>
                    <button
                        onClick={() => setMonth(p => nextMonth(p))}
                        disabled={month >= currentMonth}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors disabled:opacity-20"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Tab nav */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase font-bold whitespace-nowrap transition-all",
                            tab === t.id
                                ? "bg-foreground text-background shadow-sm"
                                : "bg-black/5 text-muted-foreground hover:bg-black/10"
                        )}
                    >
                        <t.icon className="w-3 h-3" />
                        {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tab + month}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                >
                    {/* ── RESUMEN ─────────────────────────────────────────── */}
                    {tab === "resumen" && (
                        <>
                            {/* 4 KPI cards */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: "Ingresos", value: `$${income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-success", bg: "bg-success/5 border border-success/10", icon: ArrowDownRight },
                                    { label: "Gastos", value: `$${expense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-error", bg: "bg-error/5 border border-error/10", icon: ArrowUpRight },
                                    { label: "Neto", value: `${net >= 0 ? "+" : ""}$${Math.abs(net).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: netColor, bg: "paper-card", icon: NetIcon },
                                    { label: "Tasa ahorro", value: `${savingsRate}%`, color: savingsRate >= 20 ? "text-success" : savingsRate > 0 ? "text-yellow-600" : "text-error", bg: "paper-card", icon: Target },
                                ].map((kpi, i) => (
                                    <motion.div
                                        key={kpi.label}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.06 }}
                                        className={cn("rounded-xl p-3.5", kpi.bg)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest">{kpi.label}</p>
                                            <kpi.icon className={cn("w-3.5 h-3.5", kpi.color)} />
                                        </div>
                                        <p className={cn("font-mono font-bold text-xl tracking-tighter", kpi.color)}>{kpi.value}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Extra stats row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="paper-card rounded-xl p-3 text-center">
                                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Movs.</p>
                                    <p className="font-mono font-bold text-lg">{txCount}</p>
                                </div>
                                <div className="paper-card rounded-xl p-3 text-center">
                                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Gasto/día</p>
                                    <p className="font-mono font-bold text-lg">${(expense / 30).toFixed(0)}</p>
                                </div>
                                <div className="paper-card rounded-xl p-3 text-center">
                                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1">vs mes ant.</p>
                                    <p className={cn("font-mono font-bold text-lg", expenseDelta > 0 ? "text-error" : "text-success")}>
                                        {expenseDelta > 0 ? "+" : ""}{expenseDelta.toFixed(0)}%
                                    </p>
                                </div>
                            </div>

                            {/* Daily bar chart */}
                            {dailyData.length > 0 && (
                                <div className="paper-card rounded-2xl p-4">
                                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-3">Actividad diaria</p>
                                    <div className="h-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={2}>
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#999", fontSize: 8, fontFamily: "monospace" }} dy={6} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#999", fontSize: 8, fontFamily: "monospace" }} tickFormatter={v => `$${v}`} />
                                                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                                                <Bar dataKey="income" fill="#4ade80" radius={[3, 3, 0, 0]} maxBarSize={12} fillOpacity={0.8} />
                                                <Bar dataKey="expense" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={12} fillOpacity={0.8} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center gap-4 mt-1">
                                        <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                                            <span className="w-2 h-2 rounded-sm bg-green-400 inline-block" /> Ingresos
                                        </span>
                                        <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                                            <span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Gastos
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Biggest expense */}
                            {biggestExpense && (
                                <div className="paper-card rounded-xl p-3.5 flex items-center justify-between">
                                    <div>
                                        <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-0.5">Mayor gasto del mes</p>
                                        <p className="font-mono font-bold text-sm">{biggestExpense.description}</p>
                                        <p className="font-mono text-[10px] text-muted-foreground">{biggestExpense.date}</p>
                                    </div>
                                    <p className="font-mono font-bold text-lg text-error">
                                        -${toUSD(biggestExpense.amount, biggestExpense.currency).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── GASTOS ──────────────────────────────────────────── */}
                    {tab === "gastos" && (
                        <>
                            {/* Pie chart */}
                            {pieData.length > 0 && (
                                <div className="paper-card rounded-2xl p-4">
                                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Distribución de gastos</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-36 h-36 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={34}
                                                        outerRadius={58}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        animationBegin={0}
                                                        animationDuration={800}
                                                    >
                                                        {pieData.map((entry, i) => (
                                                            <Cell key={`cell-${i}`} fill={entry.fill} fillOpacity={0.85} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            {topExpenseCategories.slice(0, 5).map(c => (
                                                <div key={c.id} className="flex items-center gap-2 min-w-0">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                                    <span className="font-mono text-[10px] truncate text-muted-foreground flex-1">{c.name}</span>
                                                    <span className="font-mono text-[10px] font-bold shrink-0">{c.pct.toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Category breakdown bars */}
                            <div className="space-y-2">
                                <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest">Por categoría</p>
                                {topExpenseCategories.length === 0 ? (
                                    <div className="paper-card rounded-xl p-8 text-center">
                                        <p className="font-mono text-xs text-muted-foreground opacity-40 uppercase">Sin gastos este mes</p>
                                    </div>
                                ) : topExpenseCategories.map((cat, i) => (
                                    <motion.div
                                        key={cat.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link href={`/categories/${cat.id}`}>
                                            <div className="paper-card rounded-xl p-3 space-y-2 hover:-translate-y-0.5 transition-transform active:scale-[0.99]">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                                            {createElement(resolveIcon(cat.icon), { className: "w-3.5 h-3.5" })}
                                                        </span>
                                                        <p className="font-mono text-xs font-bold truncate">{cat.name}</p>
                                                    </div>
                                                    <p className="font-mono text-xs font-bold text-error shrink-0 ml-2">
                                                        -${cat.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: cat.color }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${cat.pct}%` }}
                                                        transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                                                    />
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-mono text-[9px] text-muted-foreground">{cat.pct.toFixed(1)}% del total</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── INGRESOS ─────────────────────────────────────────── */}
                    {tab === "ingresos" && (
                        <>
                            {/* Radial bar */}
                            {topIncomeCategories.length > 0 && (
                                <div className="paper-card rounded-2xl p-4">
                                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-2">Fuentes de ingreso</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-36 h-36 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={topIncomeCategories.map(c => ({ name: c.name, value: c.amount, fill: c.color }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={34}
                                                        outerRadius={58}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        animationBegin={0}
                                                        animationDuration={800}
                                                    >
                                                        {topIncomeCategories.map((c, i) => (
                                                            <Cell key={i} fill={c.color} fillOpacity={0.85} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            {topIncomeCategories.slice(0, 5).map(c => (
                                                <div key={c.id} className="flex items-center gap-2 min-w-0">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                                    <span className="font-mono text-[10px] truncate text-muted-foreground flex-1">{c.name}</span>
                                                    <span className="font-mono text-[10px] font-bold shrink-0">{c.pct.toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest">Por categoría</p>
                                {topIncomeCategories.length === 0 ? (
                                    <div className="paper-card rounded-xl p-8 text-center">
                                        <p className="font-mono text-xs text-muted-foreground opacity-40 uppercase">Sin ingresos este mes</p>
                                    </div>
                                ) : topIncomeCategories.map((cat, i) => (
                                    <motion.div
                                        key={cat.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link href={`/categories/${cat.id}`}>
                                            <div className="paper-card rounded-xl p-3 space-y-2 hover:-translate-y-0.5 transition-transform active:scale-[0.99]">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                                            {createElement(resolveIcon(cat.icon), { className: "w-3.5 h-3.5" })}
                                                        </span>
                                                        <p className="font-mono text-xs font-bold truncate">{cat.name}</p>
                                                    </div>
                                                    <p className="font-mono text-xs font-bold text-success shrink-0 ml-2">
                                                        +${cat.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: cat.color }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${cat.pct}%` }}
                                                        transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                                                    />
                                                </div>
                                                <span className="font-mono text-[9px] text-muted-foreground">{cat.pct.toFixed(1)}% del total</span>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── TENDENCIA ────────────────────────────────────────── */}
                    {tab === "tendencia" && (
                        <>
                            {/* 6-month line chart */}
                            <div className="paper-card rounded-2xl p-4">
                                <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-3">Últimos 6 meses</p>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#999", fontSize: 9, fontFamily: "monospace" }} dy={6} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#999", fontSize: 9, fontFamily: "monospace" }} tickFormatter={v => `$${v}`} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" />
                                            <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                            <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4, fill: "#dc2626", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                            <Line type="monotone" dataKey="net" stroke="#111" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 mt-2">
                                    <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground"><span className="w-3 h-0.5 bg-green-600 inline-block rounded" /> Ingresos</span>
                                    <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground"><span className="w-3 h-0.5 bg-red-600 inline-block rounded" /> Gastos</span>
                                    <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground"><span className="w-3 h-0.5 bg-black inline-block rounded opacity-40" style={{ borderTop: "1.5px dashed" }} /> Neto</span>
                                </div>
                            </div>

                            {/* Monthly table */}
                            <div className="paper-card rounded-xl overflow-hidden">
                                <div className="grid grid-cols-4 px-3 py-2 border-b border-black/5">
                                    {["Mes", "Ingresos", "Gastos", "Neto"].map(h => (
                                        <p key={h} className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest text-center first:text-left">{h}</p>
                                    ))}
                                </div>
                                {trendData.map((row, i) => (
                                    <motion.div
                                        key={row.name}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="grid grid-cols-4 px-3 py-2.5 border-b border-black/5 last:border-0"
                                    >
                                        <p className="font-mono text-[10px] font-bold uppercase">{row.name}</p>
                                        <p className="font-mono text-[10px] text-success text-center">+${row.income.toFixed(0)}</p>
                                        <p className="font-mono text-[10px] text-error text-center">-${row.expense.toFixed(0)}</p>
                                        <p className={cn("font-mono text-[10px] font-bold text-center", row.net >= 0 ? "text-success" : "text-error")}>
                                            {row.net >= 0 ? "+" : ""}${row.net.toFixed(0)}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Insight cards */}
                            <div className="grid grid-cols-2 gap-2">
                                {(() => {
                                    const avgExpense = trendData.reduce((s, r) => s + r.expense, 0) / (trendData.filter(r => r.expense > 0).length || 1);
                                    const avgIncome = trendData.reduce((s, r) => s + r.income, 0) / (trendData.filter(r => r.income > 0).length || 1);
                                    const bestMonth = [...trendData].sort((a, b) => b.net - a.net)[0];
                                    const worstMonth = [...trendData].sort((a, b) => a.net - b.net)[0];
                                    return [
                                        { label: "Gasto promedio / mes", value: `$${avgExpense.toFixed(0)}`, icon: Minus, color: "text-muted-foreground" },
                                        { label: "Ingreso promedio / mes", value: `$${avgIncome.toFixed(0)}`, icon: Zap, color: "text-success" },
                                        { label: "Mejor mes", value: bestMonth?.name ?? "-", icon: TrendingUp, color: "text-success" },
                                        { label: "Mes más ajustado", value: worstMonth?.name ?? "-", icon: TrendingDown, color: "text-error" },
                                    ];
                                })().map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.07 }}
                                        className="paper-card rounded-xl p-3"
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <item.icon className={cn("w-3 h-3", item.color)} />
                                            <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest leading-none">{item.label}</p>
                                        </div>
                                        <p className={cn("font-mono font-bold text-base tracking-tighter", item.color)}>{item.value}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
