"use client";

import { useBucketStore } from "@/lib/store/useBuckets";
import { Plus, Target, CalendarDays } from "lucide-react";

export default function BucketsPage() {
    const { buckets } = useBucketStore();

    return (
        <div className="pb-24 pt-4 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-mono tracking-tighter uppercase font-bold">
                        Savings Buckets
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs mt-1">
                        Track your financial goals
                    </p>
                </div>

                <button className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors bg-white/50 backdrop-blur-sm">
                    <Plus className="w-5 h-5 text-foreground" />
                </button>
            </header>

            <div className="space-y-4">
                {buckets.map((bucket) => {
                    const progress = Math.min((bucket.current_amount / bucket.target_amount) * 100, 100);

                    return (
                        <div key={bucket.id} className="paper-card p-5 rounded-2xl relative overflow-hidden transition-transform hover:-translate-y-1">
                            {/* Subtle noise texture */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4 border-b border-black/5 pb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center border border-black/10">
                                            <Target className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-mono font-bold uppercase tracking-tight text-sm">
                                                {bucket.name}
                                            </h3>
                                            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                                {bucket.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-sm">
                                            {progress.toFixed(0)}%
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden border border-black/10">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="font-mono text-[10px] uppercase text-muted-foreground mb-1">
                                            Current / Target
                                        </p>
                                        <p className="font-mono font-bold tracking-tighter">
                                            ${bucket.current_amount} <span className="text-muted-foreground">/ ${bucket.target_amount}</span>
                                        </p>
                                    </div>

                                    {bucket.deadline && (
                                        <div className="flex items-center space-x-1 text-muted-foreground">
                                            <CalendarDays className="w-3 h-3" />
                                            <span className="font-mono text-[10px] uppercase">
                                                {new Date(bucket.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </span>
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
