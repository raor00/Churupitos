"use client";

import { Bell } from "lucide-react";

export function Header() {
    return (
        <header className="flex items-center justify-between px-6 py-5 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                    C.
                </div>
                <h1 className="text-xl font-mono font-bold tracking-tighter text-foreground uppercase">
                    Churupitos
                </h1>
            </div>

            <button className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors border border-border bg-white/50 backdrop-blur-sm shadow-sm">
                <Bell className="w-4 h-4 text-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent border-2 border-background" />
            </button>
        </header>
    );
}
