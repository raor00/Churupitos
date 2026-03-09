"use client";

import { useMemo, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, LineChart, Line, CartesianGrid, ReferenceLine
} from "recharts";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "bars" | "trend";

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
    return new Date(y, m - 1, 1).toLocaleDateString("es-VE", { month: "short", year: "2-digit" });
}
function dayLabel(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return String(d.getDate());
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 border border-black/10 rounded-xl px-3 py-2 shadow-lg font-mono text-[11px] min-w-[110px]">
            <p className="text-muted-foreground uppercase tracking-widest text-[9px] mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>
                    {p.dataKey === "income" ? "+" : p.dataKey === "expense" ? "-" : ""}
                    ${(p.value as number).toFixed(2)}
                </p>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MonthlyChart() {
    const { transactions } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [view, setView] = useState<ViewMode>("bars");
    const currentMonth = new Date().toISOString().slice(0, 7);
    const isCurrentMonth = month === currentMonth;

    const toUSD = (amount: number, curr: string) => {
        if (curr === "USD" || curr === "USDT") return amount;
        if (curr === "VES") return amount / rate;
        if (curr === "EUR") return amount * 1.08;
        return amount;
    };

    // ── Monthly totals for last 6 months (for trend view) ─────────────────
    const trendData = useMemo(() => {
        const months: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
        return months.map((ym) => {
            const txs = transactions.filter((tx: any) => tx.date.startsWith(ym));
            const income = txs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + toUSD(t.amount, t.currency), 0);
            const expense = txs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + toUSD(t.amount, t.currency), 0);
            return { name: monthLabel(ym), income, expense, net: income - expense };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, rate]);

    // ── Daily data for selected month ─────────────────────────────────────
    const barData = useMemo(() => {
        const [y, m] = month.split("-").map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = String(i + 1).padStart(2, "0");
            const dateStr = `${month}-${day}`;
            const txs = transactions.filter((tx: any) => tx.date === dateStr);
            const income = txs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + toUSD(t.amount, t.currency), 0);
            const expense = txs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + toUSD(t.amount, t.currency), 0);
            const isToday = dateStr === new Date().toISOString().slice(0, 10);
            return { name: dayLabel(dateStr), date: dateStr, income, expense, isToday };
        }).filter(d => d.income > 0 || d.expense > 0 || d.isToday);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, month, rate]);

    // ── Month summary ─────────────────────────────────────────────────────
    const summary = useMemo(() => {
        const txs = transactions.filter((tx: any) => tx.date.startsWith(month));
        const income = txs.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + toUSD(t.amount, t.currency), 0);
        const expense = txs.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + toUSD(t.amount, t.currency), 0);
        const net = income - expense;
        return { income, expense, net };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, month, rate]);

    const NetIcon = summary.net > 0 ? TrendingUp : summary.net < 0 ? TrendingDown : Minus;
    const netColor = summary.net > 0 ? "text-success" : summary.net < 0 ? "text-error" : "text-muted-foreground";

    return (
        <div className="space-y-3">
            {/* Header row: month nav + view toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMonth(prev => prevMonth(prev))}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <p className="font-mono font-bold text-xs uppercase tracking-tight w-20 text-center">
                        {monthLabel(month)}
                    </p>
                    <button
                        onClick={() => setMonth(prev => nextMonth(prev))}
                        disabled={isCurrentMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors disabled:opacity-20"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* View toggle */}
                <div className="flex bg-black/5 rounded-full p-0.5 gap-0">
                    {(["bars", "trend"] as ViewMode[]).map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "px-3 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-widest transition-all",
                                view === v ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
                            )}
                        >
                            {v === "bars" ? "Diario" : "Tendencia"}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="paper-card rounded-xl p-3 text-center">
                    <p className="font-mono text-[8px] uppercase text-muted-foreground tracking-widest mb-0.5">Ingresos</p>
                    <p className="font-mono font-bold text-sm text-success">+${summary.income.toFixed(0)}</p>
                </div>
                <div className="paper-card rounded-xl p-3 text-center">
                    <p className="font-mono text-[8px] uppercase text-muted-foreground tracking-widest mb-0.5">Gastos</p>
                    <p className="font-mono font-bold text-sm text-error">-${summary.expense.toFixed(0)}</p>
                </div>
                <div className="paper-card rounded-xl p-3 text-center">
                    <p className="font-mono text-[8px] uppercase text-muted-foreground tracking-widest mb-0.5 flex items-center justify-center gap-0.5">
                        <NetIcon className="w-2.5 h-2.5" /> Neto
                    </p>
                    <p className={cn("font-mono font-bold text-sm", netColor)}>
                        {summary.net >= 0 ? "+" : ""}${summary.net.toFixed(0)}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="paper-card rounded-2xl p-4"
                >
                    {view === "bars" ? (
                        barData.length === 0 ? (
                            <div className="h-40 flex items-center justify-center">
                                <p className="font-mono text-[11px] text-muted-foreground opacity-40 uppercase tracking-widest">
                                    Sin datos para este mes
                                </p>
                            </div>
                        ) : (
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={2}>
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#999", fontSize: 9, fontFamily: "monospace" }}
                                            dy={6}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#999", fontSize: 9, fontFamily: "monospace" }}
                                            tickFormatter={(v) => `$${v}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                                        <Bar dataKey="income" name="income" radius={[3, 3, 0, 0]} maxBarSize={14}>
                                            {barData.map((d, i) => (
                                                <Cell key={`inc-${i}`} fill={d.isToday ? "#16a34a" : "#4ade80"} fillOpacity={d.isToday ? 1 : 0.7} />
                                            ))}
                                        </Bar>
                                        <Bar dataKey="expense" name="expense" radius={[3, 3, 0, 0]} maxBarSize={14}>
                                            {barData.map((d, i) => (
                                                <Cell key={`exp-${i}`} fill={d.isToday ? "#dc2626" : "#f87171"} fillOpacity={d.isToday ? 1 : 0.65} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )
                    ) : (
                        <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#999", fontSize: 9, fontFamily: "monospace" }}
                                        dy={6}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#999", fontSize: 9, fontFamily: "monospace" }}
                                        tickFormatter={(v) => `$${v}`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0,0,0,0.1)" }} />
                                    <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" />
                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        stroke="#16a34a"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: "#16a34a", strokeWidth: 0 }}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expense"
                                        stroke="#dc2626"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: "#dc2626", strokeWidth: 0 }}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="net"
                                        stroke="#111"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 3"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                            <span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" /> Ingresos
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                            <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Gastos
                        </span>
                        {view === "trend" && (
                            <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                                <span className="w-2.5 h-0.5 bg-foreground inline-block" style={{ borderTop: "1.5px dashed #111" }} /> Neto
                            </span>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
