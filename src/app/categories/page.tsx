"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plus, Tag, TrendingDown, AlertCircle, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useRatesStore, getRate } from "@/lib/store/useRates";

export default function CategoriesPage() {
    const { categories, transactions, updateCategory, deleteCategory } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBudget, setEditBudget] = useState("");

    const filteredCategories = categories.filter(c => c.type === activeTab);

    const toUSD = (amount: number, currency: string) => {
        if (currency === "USD" || currency === "USDT") return amount;
        if (currency === "VES") return amount / rate;
        return amount;
    };

    const chartData = filteredCategories.map(cat => {
        const total = transactions
            .filter(tx => tx.category_id === cat.id && tx.type === activeTab)
            .reduce((sum, tx) => sum + toUSD(tx.amount, tx.currency), 0);
        return { name: cat.name, total, color: cat.color, id: cat.id };
    }).sort((a, b) => b.total - a.total);

    const handleSaveBudget = (catId: string) => {
        const val = parseFloat(editBudget);
        if (!isNaN(val) && val >= 0) {
            updateCategory(catId, { monthly_budget: val > 0 ? val : undefined });
        }
        setEditingId(null);
    };

    return (
        <div className="pb-28 pt-4 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">Análisis</p>
                    <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold">Categorías</h1>
                </div>
                <Link href="/categories/new" className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                </Link>
            </header>

            <div className="flex bg-black/5 p-1 rounded-xl">
                {(["expense", "income"] as const).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={cn("flex-1 py-2.5 font-mono text-xs font-bold uppercase rounded-lg transition-all", activeTab === t ? t === "expense" ? "bg-white text-error shadow-sm" : "bg-white text-success shadow-sm" : "text-muted-foreground")}>
                        {t === "expense" ? "Gastos" : "Ingresos"}
                    </button>
                ))}
            </div>

            {chartData.some(d => d.total > 0) && (
                <div className="paper-card p-5 rounded-2xl">
                    <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-2" />Distribución (USD)
                    </h2>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" hide />
                                <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px" }} formatter={(value) => [`$${(value as number).toFixed(2)}`, "Total"]} />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color || "#111"} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {filteredCategories.map((cat) => {
                    const catTotal = chartData.find(d => d.id === cat.id)?.total ?? 0;
                    const budget = cat.monthly_budget;
                    const progress = budget ? Math.min((catTotal / budget) * 100, 100) : 0;
                    const overBudget = budget ? catTotal > budget : false;
                    const nearBudget = budget ? catTotal > budget * 0.8 && !overBudget : false;
                    const isEditing = editingId === cat.id;

                    return (
                        <div key={cat.id} className="paper-card p-4 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: cat.color }} />
                            <div className="pl-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-mono font-bold tracking-tight text-sm truncate">{cat.name}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground">Gastado: <span className="font-bold">${catTotal.toFixed(2)}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                                        {isEditing ? (
                                            <div className="flex items-center space-x-1">
                                                <span className="font-mono text-xs text-muted-foreground">$</span>
                                                <input autoFocus type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} className="w-20 bg-transparent border-b border-primary font-mono text-sm outline-none text-right" placeholder="0.00" step="0.01" />
                                                <button onClick={() => handleSaveBudget(cat.id)} className="p-1 rounded text-success hover:bg-success/10"><Check className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setEditingId(null)} className="p-1 rounded text-muted-foreground hover:bg-black/5"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                {budget && activeTab === "expense" && <span className="font-mono text-[10px] text-muted-foreground">/${budget.toFixed(0)}/mes</span>}
                                                {activeTab === "expense" && (
                                                    <button onClick={() => { setEditingId(cat.id); setEditBudget(budget?.toString() ?? ""); }} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                                                        <Pencil className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                )}
                                                {!cat.is_default && (
                                                    <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-error/5 transition-colors">
                                                        <Trash2 className="w-3 h-3 text-error opacity-60" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                {budget && activeTab === "expense" && (
                                    <div className="space-y-1.5">
                                        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-700", overBudget ? "bg-error" : nearBudget ? "bg-warning" : "bg-success")} style={{ width: `${progress}%` }} />
                                        </div>
                                        {(overBudget || nearBudget) && (
                                            <div className={cn("flex items-center space-x-1 text-[10px] font-mono uppercase font-bold", overBudget ? "text-error" : "text-warning")}>
                                                <AlertCircle className="w-3 h-3" /><span>{overBudget ? "¡Pasaste el presupuesto!" : "¡Cerca del límite!"}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredCategories.length === 0 && (
                    <div className="text-center py-10 font-mono text-muted-foreground text-sm uppercase opacity-40">Sin categorías de este tipo</div>
                )}
            </div>
        </div>
    );
}
