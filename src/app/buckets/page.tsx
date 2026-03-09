"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plus, Target, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function BucketsPage() {
    const { buckets } = useCurrentUser();

    return (
        <div className="pb-safe pt-4 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">Ahorros</p>
                    <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold">Mis Metas</h1>
                </div>
                <Link href="/buckets/new" className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 active:scale-95 transition-all">
                    <Plus className="w-5 h-5" />
                </Link>
            </header>

            <div className="space-y-4">
                {buckets.length === 0 ? (
                    <div className="text-center py-14 font-mono text-muted-foreground text-sm uppercase opacity-40">Sin metas creadas</div>
                ) : buckets.map((bucket) => {
                    const progress = Math.min((bucket.current_amount / bucket.target_amount) * 100, 100);
                    const isComplete = progress >= 100;
                    return (
                        <div key={bucket.id} className="paper-card p-5 rounded-2xl relative overflow-hidden transition-transform hover:-translate-y-0.5">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4 border-b border-black/5 pb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isComplete ? "bg-success/10 border-success/20 text-success" : "bg-black/5 border-black/10 text-primary"}`}>
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-mono font-bold uppercase tracking-tight text-sm">{bucket.name}</h3>
                                            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{bucket.description}</p>
                                        </div>
                                    </div>
                                    <p className={`font-mono font-bold text-sm ${isComplete ? "text-success" : ""}`}>{progress.toFixed(0)}%</p>
                                </div>
                                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden mb-4 border border-black/10">
                                    <div className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-success" : "bg-primary"}`} style={{ width: `${progress}%` }} />
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Ahorrado / Meta</p>
                                        <p className="font-mono font-bold tracking-tighter">
                                            ${bucket.current_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                                            <span className="text-muted-foreground">/ ${bucket.target_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                        </p>
                                    </div>
                                    {bucket.deadline && (
                                        <div className="flex items-center space-x-1 text-muted-foreground">
                                            <CalendarDays className="w-3 h-3" />
                                            <span className="font-mono text-[10px] uppercase">{new Date(bucket.deadline).toLocaleDateString("es-VE", { month: "short", year: "numeric" })}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
