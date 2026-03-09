import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { AnimatedCounter } from "../shared/AnimatedCounter";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    amount: number;
    currencyPrefix?: string;
    icon: LucideIcon;
    trend?: number; // percentage, positive or negative
    trendLabel?: string;
    className?: string;
}

export function KPICard({
    title,
    amount,
    currencyPrefix = "$",
    icon: Icon,
    trend,
    trendLabel,
    className
}: KPICardProps) {
    return (
        <div className={cn("glass-card p-5 relative overflow-hidden", className)}>
            {/* Decorative noise/texture overlay for typewriter feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-mono tracking-tight text-muted-foreground uppercase">
                        {title}
                    </h3>
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center border border-black/10">
                        <Icon className="w-4 h-4 text-primary" />
                    </div>
                </div>

                <div className="flex items-baseline space-x-1 mb-2">
                    <span className="text-lg font-mono text-muted-foreground">{currencyPrefix}</span>
                    <span className="text-3xl font-mono font-bold tracking-tighter text-foreground">
                        <AnimatedCounter value={amount} format="currency" />
                    </span>
                </div>

                {trend !== undefined && (
                    <div className="flex items-center space-x-2 text-xs font-mono">
                        <div className={cn(
                            "flex items-center space-x-1 px-1.5 py-0.5 rounded-sm",
                            trend >= 0 ? "text-success bg-success/10" : "text-error bg-error/10"
                        )}>
                            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{Math.abs(trend)}%</span>
                        </div>
                        {trendLabel && (
                            <span className="text-muted-foreground">{trendLabel}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
