"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";

export function RecentTransactions() {
    const { transactions, categories } = useCurrentUser();

    const recent = [...transactions]
        .sort((a: any, b: any) => b.date.localeCompare(a.date) || b.created_at?.localeCompare(a.created_at ?? "") || 0)
        .slice(0, 5);

    const getCategoryName = (id: string) => categories.find((c: any) => c.id === id)?.name ?? "—";

    const currencyPrefix = (curr: string) => {
        if (curr === "USD" || curr === "USDT") return "$";
        if (curr === "VES") return "Bs.";
        if (curr === "EUR") return "€";
        return "$";
    };

    const formatDate = (dateStr: string) => {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        if (dateStr === today) return "Hoy";
        if (dateStr === yesterday) return "Ayer";
        return new Date(dateStr + "T12:00:00").toLocaleDateString("es-VE", { day: "numeric", month: "short" });
    };

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-mono tracking-widest text-muted-foreground uppercase">Recientes</h2>
                {recent.length > 0 && (
                    <Link href="/transactions" className="text-[10px] font-mono text-primary uppercase tracking-widest hover:underline">
                        Ver Todo
                    </Link>
                )}
            </div>

            {recent.length === 0 ? (
                <div className="paper-card rounded-xl p-6 flex flex-col items-center space-y-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-1">
                        <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-40" />
                    </div>
                    <p className="font-mono text-xs font-bold uppercase tracking-tight text-muted-foreground">
                        Sin movimientos recientes
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground opacity-60">
                        Toca <span className="font-bold">+</span> para registrar tu primer gasto o ingreso
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {recent.map((tx: any) => (
                        <div
                            key={tx.id}
                            className="paper-card p-3.5 rounded-xl flex items-center justify-between transition-transform hover:-translate-y-0.5"
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
                                    <p className="font-mono font-bold tracking-tight text-sm truncate">{tx.description}</p>
                                    <div className="flex items-center space-x-1.5 text-[10px] text-muted-foreground mt-0.5">
                                        <span className="font-mono">{formatDate(tx.date)}</span>
                                        <span>·</span>
                                        <span className="font-mono truncate">{getCategoryName(tx.category_id)}</span>
                                    </div>
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
