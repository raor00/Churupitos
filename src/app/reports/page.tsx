"use client";

import { WeeklyBarChart } from "@/components/dashboard/Charts/WeeklyBarChart";
import { Download, FileText } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="pb-24 pt-4 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-mono tracking-tighter uppercase font-bold">
                        Analytics
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs mt-1">
                        REPORT-GEN: ACTIVE
                    </p>
                </div>

                <button className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors bg-white/50 backdrop-blur-sm">
                    <Download className="w-5 h-5 text-foreground" />
                </button>
            </header>

            {/* Main Chart Card */}
            <div className="paper-card p-5 rounded-2xl relative overflow-hidden">
                {/* Subtle noise texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

                <div className="relative z-10">
                    <div className="flex justify-between items-end border-b border-black/10 pb-4">
                        <div>
                            <p className="font-mono text-[10px] text-muted-foreground uppercase mb-1">
                                This Week's Spend
                            </p>
                            <h2 className="font-mono text-3xl font-bold tracking-tighter">
                                $2,450<span className="text-muted-foreground text-lg">.00</span>
                            </h2>
                        </div>

                        <div className="text-right">
                            <span className="font-mono text-[10px] bg-error/10 text-error px-2 py-1 rounded">
                                +12% vs last
                            </span>
                        </div>
                    </div>

                    <WeeklyBarChart />
                </div>
            </div>

            {/* Categories Breakdown */}
            <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Top Categories
                </h3>

                <div className="space-y-3">
                    {[
                        { name: "Supermarket", amount: "$850.00", pct: "34%", width: "85%" },
                        { name: "Auto", amount: "$420.00", pct: "17%", width: "42%" },
                        { name: "Dining Out", amount: "$310.00", pct: "12%", width: "31%" },
                        { name: "Utilities", amount: "$150.00", pct: "6%", width: "15%" },
                    ].map((cat, i) => (
                        <div key={i} className="paper-card p-4 rounded-xl flex flex-col justify-center space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-mono text-sm font-bold">{cat.name}</span>
                                <span className="font-mono text-sm">{cat.amount}</span>
                            </div>
                            <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: cat.width }} />
                            </div>
                            <div className="text-right text-[10px] font-mono text-muted-foreground">
                                {cat.pct} of total
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
