"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ArrowRightLeft,
    Wallet,
    Home,
    Plus,
    Tag,
    Target,
    Calculator,
    MoreHorizontal,
    X,
    BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
    label: string;
    icon: React.ElementType;
    path: string;
};

const ALL_EXTRA_ITEMS: NavItem[] = [
    { label: "Saldos", icon: Wallet, path: "/accounts" },
    { label: "Categ", icon: Tag, path: "/categories" },
    { label: "Stats", icon: BarChart2, path: "/reports" },
    { label: "Metas", icon: Target, path: "/buckets" },
    { label: "Calc", icon: Calculator, path: "/calculator" },
];

const DEFAULT_PINNED = ALL_EXTRA_ITEMS[0];
const STORAGE_KEY = "churupitos-nav-pinned";

function NavButton({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
    return (
        <Link href={href} className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors duration-200">
            {active && (
                <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-full bg-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
                    transition={{ type: "spring", damping: 26, stiffness: 380 }}
                />
            )}
            <Icon className={cn("w-5 h-5 mb-0.5 relative z-10 transition-colors duration-200", active ? "text-foreground" : "text-muted-foreground")} />
            <span className={cn("text-[9px] font-mono tracking-tighter font-bold uppercase relative z-10 transition-colors duration-200", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
        </Link>
    );
}

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [pinned, setPinned] = useState<NavItem>(DEFAULT_PINNED);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const found = ALL_EXTRA_ITEMS.find(i => i.path === saved);
            if (found) setPinned(found);
        }
    }, []);

    const handleSelectExtra = (item: NavItem) => {
        setPinned(item);
        localStorage.setItem(STORAGE_KEY, item.path);
        setSheetOpen(false);
        router.push(item.path);
    };

    return (
        <>
            {/* Safe area spacer so content scrolls above the nav */}
            <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
                style={{ height: "calc(5rem + env(safe-area-inset-bottom))" }} />
            <nav
                className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-16 bg-white/55 backdrop-blur-2xl border border-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] rounded-full z-50 px-2 flex items-center justify-around"
                style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
                {/* Inicio — fixed */}
                <NavButton href="/" label="Inicio" icon={Home} active={pathname === "/"} />

                {/* Trans — fixed */}
                <NavButton href="/transactions" label="Trans" icon={ArrowRightLeft} active={pathname === "/transactions"} />

                {/* FAB + — fixed */}
                <div className="relative -top-6">
                    <Link href="/transactions/new">
                        <div className="w-14 h-14 bg-foreground rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:scale-95 border-[3px] border-white/60">
                            <Plus className="w-6 h-6 text-background" />
                        </div>
                    </Link>
                </div>

                {/* Pinned extra — customizable */}
                <NavButton href={pinned.path} label={pinned.label} icon={pinned.icon} active={pathname === pinned.path} />

                {/* Más — opens sheet */}
                <button
                    onClick={() => setSheetOpen(v => !v)}
                    className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors duration-200"
                >
                    {sheetOpen && (
                        <motion.div
                            layoutId="nav-active-pill"
                            className="absolute inset-0 rounded-full bg-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
                            transition={{ type: "spring", damping: 26, stiffness: 380 }}
                        />
                    )}
                    <MoreHorizontal className={cn("w-5 h-5 mb-0.5 relative z-10 transition-colors duration-200", sheetOpen ? "text-foreground" : "text-muted-foreground")} />
                    <span className={cn("text-[9px] font-mono tracking-tighter font-bold uppercase relative z-10 transition-colors duration-200", sheetOpen ? "text-foreground" : "text-muted-foreground")}>Más</span>
                </button>
            </nav>

            {/* Bottom sheet */}
            <AnimatePresence>
                {sheetOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
                            onClick={() => setSheetOpen(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            key="sheet"
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={{ top: 0, bottom: 0.3 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 80 || info.velocity.y > 400) setSheetOpen(false);
                            }}
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 320 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl border-t border-black/5"
                        >
                            {/* Handle */}
                            <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mt-3 mb-1" />

                            <div className="px-6 pt-3" style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="font-mono font-bold text-sm uppercase tracking-widest">Más opciones</h2>
                                    <button
                                        onClick={() => setSheetOpen(false)}
                                        className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-3">
                                    {ALL_EXTRA_ITEMS.map((item) => {
                                        const isActive = pathname === item.path;
                                        const isPinned = pinned.path === item.path;
                                        return (
                                            <button
                                                key={item.path}
                                                onClick={() => handleSelectExtra(item)}
                                                className={cn(
                                                    "flex flex-col items-center space-y-2 py-4 rounded-2xl transition-all active:scale-95",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : isPinned
                                                        ? "bg-black/6 text-foreground border border-black/8"
                                                        : "bg-black/3 text-muted-foreground hover:bg-black/8"
                                                )}
                                            >
                                                <item.icon className="w-6 h-6" />
                                                <span className="font-mono text-[10px] font-bold uppercase tracking-tight">
                                                    {item.label}
                                                </span>
                                                {isPinned && (
                                                    <span className="text-[8px] font-mono text-muted-foreground -mt-1 tracking-widest">
                                                        FIJADO
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <p className="text-center font-mono text-[10px] text-muted-foreground mt-4 opacity-50">
                                    Toca para navegar y fijar en la barra
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
