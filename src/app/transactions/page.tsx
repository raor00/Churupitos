"use client";

import { useTransactionStore } from "@/lib/store/useTransactions";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransactionsListPage() {
    const { transactions } = useTransactionStore();

    return (
        <div className="pb-24 pt-4 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-mono tracking-tighter uppercase font-bold text-muted-foreground">
                        Tus Movimientos
                    </h1>
                    <p className="font-mono text-xs mt-1">
                        Historial de transacciones
                    </p>
                </div>

                <button className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors bg-white/50 backdrop-blur-sm">
                    <Search className="w-5 h-5 text-foreground" />
                </button>
            </header>

            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="text-center p-10 font-mono text-muted-foreground text-sm uppercase opacity-50">
                        No hay movimientos registrados.
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="paper-card p-4 rounded-xl flex items-center justify-between transition-transform hover:-translate-y-0.5">
                            <div className="flex items-center space-x-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border",
                                    tx.type === "income"
                                        ? "bg-success/5 border-success/20 text-success"
                                        : "bg-error/5 border-error/20 text-error"
                                )}>
                                    {tx.type === "income" ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-mono font-bold tracking-tight text-sm text-foreground">{tx.description}</p>
                                    <div className="flex items-center space-x-2 text-[10px] uppercase text-muted-foreground mt-0.5">
                                        <span className="font-mono">{tx.date}</span>
                                        <span>•</span>
                                        <span className="font-mono">{tx.category_id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={cn(
                                "font-mono font-bold tracking-tighter text-right",
                                tx.type === "income" ? "text-success" : "text-foreground"
                            )}>
                                {tx.type === "income" ? "+" : "-"}
                                {tx.currency === "USD" ? "$" : tx.currency === "VES" ? "Bs." : tx.currency + " "}
                                {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
