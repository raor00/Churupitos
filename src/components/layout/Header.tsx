"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuth";
import { useRouter } from "next/navigation";
import { Calculator, LogOut, UserPlus, Upload } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
    const { getCurrentUser, logout, users, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const user = getCurrentUser();
    const [menuOpen, setMenuOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
        router.replace("/auth");
    };

    return (
        <header className="flex items-center justify-between px-6 py-5 bg-background/80 backdrop-blur-xl sticky top-0 z-40 border-b border-black/5">
            {/* Logo — opens menu */}
            <div ref={ref} className="relative flex items-center space-x-3">
                <button
                    onClick={() => setMenuOpen(v => !v)}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-sm shadow-sm hover:opacity-80 active:scale-95 transition-all"
                >
                    C.
                </button>
                <h1 className="text-xl font-mono font-bold tracking-tighter text-foreground uppercase select-none">
                    Churupitos
                </h1>

                <AnimatePresence>
                    {menuOpen && isAuthenticated && user && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-black/10 overflow-hidden z-50"
                        >
                            {/* Current user info */}
                            <div className="px-4 py-3 border-b border-black/5 flex items-center space-x-3">
                                <div
                                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-mono font-bold text-sm"
                                    style={{ backgroundColor: user.color }}
                                >
                                    {user.name[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono font-bold text-sm uppercase tracking-tight truncate">{user.name}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground">@{user.username}</p>
                                </div>
                            </div>

                            {/* Switch user */}
                            {users.filter(u => u.id !== user.id).length > 0 && (
                                <div className="px-2 py-1.5 border-b border-black/5">
                                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest px-2 py-1">
                                        Cambiar a...
                                    </p>
                                    {users.filter(u => u.id !== user.id).map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => {
                                                setMenuOpen(false);
                                                logout();
                                                router.replace("/auth");
                                            }}
                                            className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-black/5 transition-colors text-left"
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-mono font-bold text-xs flex-shrink-0"
                                                style={{ backgroundColor: u.color }}
                                            >
                                                {u.name[0].toUpperCase()}
                                            </div>
                                            <span className="font-mono text-xs font-bold truncate">{u.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="p-2 space-y-0.5">
                                <Link
                                    href="/import"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors w-full"
                                >
                                    <Upload className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-mono text-xs">Importar CSV</span>
                                </Link>
                                <Link
                                    href="/auth/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors w-full"
                                >
                                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-mono text-xs">Nuevo usuario</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-error/5 transition-colors w-full text-error"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="font-mono text-xs">Cerrar sesión</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right side: calculator + user avatar (display only) */}
            <div className="flex items-center space-x-2">
                <Link
                    href="/calculator"
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors border border-border bg-white/50 backdrop-blur-sm shadow-sm"
                    title="Calculadora"
                >
                    <Calculator className="w-4 h-4 text-foreground" />
                </Link>

                {isAuthenticated && user && (
                    <Link
                        href="/profile"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm hover:opacity-80 active:scale-95 transition-all"
                        style={{ backgroundColor: user.color }}
                        title="Mi perfil"
                    >
                        {user.name[0].toUpperCase()}
                    </Link>
                )}
            </div>
        </header>
    );
}
