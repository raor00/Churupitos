"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";

export function RecentTransactions() {
    const { transactions, categories } = useCurrentUser();
    const recent = transactions.slice(0, 5);
    const getCategoryName = (id: string) => categories.find((c: any) => c.id === id)?.name ?? "—";

    if (recent.length === 0) return null;

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-mono tracking-widest text-muted-foreground uppercase">Recientes</h2>
                <Link href="/transactions" className="text-[10px] font-mono text-primary uppercase tracking-widest hover:underline">Ver Todo</Link>
            </div>
            <div className="space-y-2">
                {recent.map((tx: any) => (
                    <div key={tx.id} className="paper-card p-3.5 rounded-xl flex items-center justify-between transition-transform hover:-translate-y-0.5">
                        <div className="flex items-center space-x-3 min-w-0">
                            <div className={cn("w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center border", tx.type === "income" ? "bg-success/5 border-success/20 text-success" : "bg-error/5 border-error/20 text-error")}>
                                {tx.type === "income" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                                <p className="font-mono font-bold tracking-tight text-sm truncate">{tx.description}</p>
                                <div className="flex items-center space-x-2 text-[10px] text-muted-foreground mt-0.5">
                                    <span className="font-mono">{tx.date}</span>
                                    <span>·</span>
                                    <span className="font-mono truncate">{getCategoryName(tx.category_id)}</span>
                                </div>
                            </div>
                        </div>
                        <div className={cn("font-mono font-bold tracking-tighter text-right flex-shrink-0 ml-3 text-sm", tx.type === "income" ? "text-success" : "text-foreground")}>
                            {tx.type === "income" ? "+" : "-"}
                            {tx.currency === "USD" || tx.currency === "USDT" ? "$" : tx.currency === "VES" ? "Bs." : "€"}
                            {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
