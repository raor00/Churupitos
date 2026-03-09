import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data, eventually replaced by Supabase
const mockTransactions = [
    { id: 1, type: "expense", amount: 45.50, currency: "$", description: "Groceries", date: "Today", category: "Food" },
    { id: 2, type: "income", amount: 2500.00, currency: "Bs.", description: "Freelance Client", date: "Yesterday", category: "Work" },
    { id: 3, type: "expense", amount: 12.00, currency: "$", description: "Netflix", date: "Mar 5", category: "Subscriptions" },
];

export function RecentTransactions() {
    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-mono tracking-tight text-muted-foreground uppercase">
                    Movimientos Recientes
                </h2>
                <button className="text-xs font-mono text-primary hover:underline">
                    Ver Todo
                </button>
            </div>

            <div className="space-y-3">
                {mockTransactions.map((tx) => (
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
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="font-mono">{tx.date}</span>
                                    <span>•</span>
                                    <span className="font-mono">{tx.category}</span>
                                </div>
                            </div>
                        </div>

                        <div className={cn(
                            "font-mono font-bold tracking-tighter text-right",
                            tx.type === "income" ? "text-success" : "text-foreground"
                        )}>
                            {tx.type === "income" ? "+" : "-"}
                            {tx.currency}
                            {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
