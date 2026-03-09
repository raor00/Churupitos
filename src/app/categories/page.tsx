"use client";

import { useState } from "react";
import { useTransactionStore } from "@/lib/store/useTransactions";
import { Plus, Tag, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function CategoriesPage() {
    const { categories, transactions } = useTransactionStore();
    const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

    const filteredCategories = categories.filter(c => c.type === activeTab);

    // Calculate mock expenses per category for the chart
    const chartData = filteredCategories.map(cat => {
        const total = transactions
            .filter(tx => tx.category_id === cat.id && tx.type === activeTab)
            .reduce((sum, tx) => sum + (tx.currency === "USD" ? tx.amount : tx.amount / 45), 0); // Normalize to USD for chart
        return { name: cat.name, total, color: cat.color, id: cat.id };
    }).sort((a, b) => b.total - a.total); // Sort highest first

    return (
        <div className="pb-24 pt-4 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-mono tracking-tighter uppercase font-bold text-muted-foreground">
                        Categorías
                    </h1>
                    <p className="font-mono text-xs mt-1">
                        Gestión y Análisis
                    </p>
                </div>

                <Link href="/categories/new" className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors bg-white/50 backdrop-blur-sm">
                    <Plus className="w-5 h-5 text-foreground" />
                </Link>
            </header>

            {/* Tabs */}
            <div className="flex bg-black/5 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab("expense")}
                    className={cn(
                        "flex-1 py-2 font-mono text-xs font-bold uppercase rounded-md transition-all",
                        activeTab === "expense" ? "bg-white shadow-sm" : "text-muted-foreground"
                    )}
                >
                    Gastos
                </button>
                <button
                    onClick={() => setActiveTab("income")}
                    className={cn(
                        "flex-1 py-2 font-mono text-xs font-bold uppercase rounded-md transition-all",
                        activeTab === "income" ? "bg-white shadow-sm" : "text-muted-foreground"
                    )}
                >
                    Ingresos
                </button>
            </div>

            {/* Chart Section */}
            <div className="paper-card p-5 rounded-2xl">
                <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Distribución (USD)
                </h2>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <XAxis dataKey="name" hide />
                            <Tooltip
                                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                                contentStyle={{
                                    backgroundColor: "rgba(255,255,255,0.9)",
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    borderRadius: "8px",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]}
                            />
                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || "#111"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
                {filteredCategories.map((cat) => {
                    const catTotal = chartData.find(d => d.id === cat.id)?.total || 0;
                    const budget = cat.monthly_budget;
                    let showWarning = false;
                    let warningText = "";
                    let progress = 0;

                    if (budget && activeTab === "expense") {
                        progress = Math.min((catTotal / budget) * 100, 100);
                        if (catTotal > budget) {
                            showWarning = true;
                            warningText = "¡Te pasaste del presupuesto!";
                        } else if (catTotal > budget * 0.8) {
                            showWarning = true;
                            warningText = "¡Cerca del límite!";
                        }
                    }

                    return (
                        <div key={cat.id} className="paper-card p-4 rounded-xl group relative overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center opacity-80"
                                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                    >
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-mono font-bold tracking-tight text-sm text-foreground">{cat.name}</p>
                                        {budget && activeTab === "expense" && (
                                            <p className="font-mono text-[10px] text-muted-foreground uppercase">
                                                Presupuesto: ${budget.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="font-mono font-bold tracking-tighter text-right">
                                    ${catTotal.toFixed(2)}
                                    {budget && activeTab === "expense" && (
                                        <div className="text-[10px] font-mono text-muted-foreground font-normal">
                                            {progress.toFixed(0)}% consumido
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar & Warning for Expenses */}
                            {budget && activeTab === "expense" && (
                                <div className="space-y-2 relative z-10">
                                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                progress >= 100 ? "bg-error" : progress >= 80 ? "bg-warning" : "bg-success"
                                            )}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    {showWarning && (
                                        <div className={cn(
                                            "flex items-center space-x-1 text-[10px] font-mono uppercase font-bold",
                                            progress >= 100 ? "text-error" : "text-warning"
                                        )}>
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{warningText}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredCategories.length === 0 && (
                    <div className="text-center p-10 font-mono text-muted-foreground text-sm uppercase opacity-50">
                        No hay categorías de este tipo
                    </div>
                )}
            </div>

        </div>
    );
}
