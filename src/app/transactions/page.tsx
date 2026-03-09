"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function TransactionsListPage() {
    const { transactions, categories } = useCurrentUser();

    const getCategoryName = (id: string) => categories.find((c: any) => c.id === id)?.name ?? id;

    return (
        <div className="pb-28 pt-4 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">
                        Historial
                    </p>
                    <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold">
                        Movimientos
                    </h1>
                </div>
                <Link
                    href="/transactions/new"
                    className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                </Link>
            </header>

            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="text-center py-14 font-mono text-muted-foreground text-sm uppercase opacity-40">
                        Sin movimientos registrados
                    </div>
                ) : (
                    transactions.map((tx: any) => (
                        <div
                            key={tx.id}
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
                                    <div className="flex items-center space-x-2 text-[10px] uppercase text-muted-foreground mt-0.5">
                                        <span className="font-mono">{tx.date}</span>
                                        <span>·</span>
                                        <span className="font-mono truncate">{getCategoryName(tx.category_id)}</span>
                                    </div>
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
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
