"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ArrowRightLeft,
    Wallet,
    Home,
    ListOrdered,
    Plus,
    Target,
    Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Inicio", icon: Home, path: "/" },
    { label: "Trans", icon: ListOrdered, path: "/transactions" },
    { label: "New", icon: Plus, path: "/transactions/new", isFab: true },
    { label: "Metas", icon: Target, path: "/buckets" },
    { label: "Calc", icon: Calculator, path: "/calculator" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-full z-50 px-2 flex items-center justify-around">
            {navItems.map((item, i) => {
                if (item.isFab) {
                    return (
                        <div key={i} className="relative -top-6">
                            <Link href={item.path}>
                                <div className="w-14 h-14 bg-foreground rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 border-4 border-white/50 relative">
                                    <item.icon className="w-6 h-6 text-background" />
                                </div>
                            </Link>
                        </div>
                    );
                }

                const isActive = pathname === item.path;

                return (
                    <Link
                        key={i}
                        href={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-black/5"
                        )}
                    >
                        <item.icon className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-mono tracking-tighter font-bold uppercase">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
