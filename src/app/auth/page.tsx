"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuth";
import { useTransactionStore } from "@/lib/store/useTransactions";
import { useRouter } from "next/navigation";
import { isBiometricSupported } from "@/lib/auth/webauthn";
import { Plus, Lock, Fingerprint, User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
    const router = useRouter();
    const { users, loginWithPin, loginWithBiometric } = useAuthStore();
    const { seedForUser } = useTransactionStore();

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [pin, setPin] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const selectedUser = users.find(u => u.id === selectedUserId);
    const bioSupported = isBiometricSupported();

    const handlePinInput = (val: string) => {
        if (pin.length >= 6) return;
        const next = pin + val;
        setPin(next);
        setError(null);
        if (next.length === 6) submitPin(next);
    };

    const submitPin = async (p: string) => {
        if (!selectedUserId) return;
        setLoading(true);
        const ok = await loginWithPin(selectedUserId, p);
        setLoading(false);
        if (ok) {
            seedForUser(selectedUserId);
            router.replace("/");
        } else {
            setError("PIN incorrecto. Intenta de nuevo.");
            setPin("");
        }
    };

    const handleBiometric = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        const ok = await loginWithBiometric(selectedUserId);
        setLoading(false);
        if (ok) {
            seedForUser(selectedUserId);
            router.replace("/");
        } else {
            setError("Autenticación biométrica fallida.");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
            {/* Logo */}
            <div className="mb-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center font-mono font-bold text-xl mx-auto mb-3 shadow-lg">
                    C.
                </div>
                <h1 className="text-2xl font-mono font-bold tracking-tighter uppercase">Churupitos</h1>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                    {selectedUser ? `Hola, ${selectedUser.name}` : "¿Quién eres?"}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {!selectedUserId ? (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="w-full max-w-xs space-y-3"
                    >
                        {users.map((u) => (
                            <button
                                key={u.id}
                                onClick={() => setSelectedUserId(u.id)}
                                className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-white border border-black/10 hover:bg-black/5 active:scale-[0.98] transition-all shadow-sm"
                            >
                                <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-mono font-bold text-lg flex-shrink-0"
                                    style={{ backgroundColor: u.color }}
                                >
                                    {u.name[0].toUpperCase()}
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="font-mono font-bold uppercase tracking-tight truncate">{u.name}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground">@{u.username}</p>
                                </div>
                                {u.biometricEnabled && (
                                    <Fingerprint className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                                )}
                            </button>
                        ))}

                        {users.length === 0 && (
                            <div className="text-center py-8">
                                <User className="w-10 h-10 text-muted-foreground opacity-30 mx-auto mb-3" />
                                <p className="font-mono text-sm text-muted-foreground uppercase opacity-50">
                                    Sin usuarios registrados
                                </p>
                            </div>
                        )}

                        <Link
                            href="/auth/register"
                            className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl border-2 border-dashed border-black/15 hover:border-black/30 hover:bg-black/5 transition-all font-mono text-sm text-muted-foreground"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Crear nuevo usuario</span>
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        key="pin"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="w-full max-w-xs space-y-6"
                    >
                        {/* User avatar */}
                        <div className="flex flex-col items-center space-y-2">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-mono font-bold text-2xl shadow-md"
                                style={{ backgroundColor: selectedUser?.color }}
                            >
                                {selectedUser?.name[0].toUpperCase()}
                            </div>
                            <p className="font-mono text-sm uppercase font-bold tracking-tight">{selectedUser?.name}</p>
                        </div>

                        {/* PIN dots */}
                        <div>
                            <p className="font-mono text-[10px] uppercase text-muted-foreground text-center mb-4 tracking-widest">
                                <Lock className="inline w-3 h-3 mr-1 mb-0.5" />
                                Ingresa tu PIN de 6 dígitos
                            </p>
                            <div className="flex justify-center space-x-3 mb-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                            i < pin.length
                                                ? "bg-foreground border-foreground scale-110"
                                                : "border-black/20"
                                        }`}
                                    />
                                ))}
                            </div>
                            {error && (
                                <p className="text-center font-mono text-[10px] text-error mt-2">{error}</p>
                            )}
                        </div>

                        {/* Numpad */}
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <button
                                    key={n}
                                    onClick={() => handlePinInput(n.toString())}
                                    disabled={loading}
                                    className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:scale-95 active:bg-black/10 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {n}
                                </button>
                            ))}
                            {/* Bottom row: biometric | 0 | delete */}
                            {selectedUser?.biometricEnabled && bioSupported ? (
                                <button
                                    onClick={handleBiometric}
                                    disabled={loading}
                                    className="h-14 rounded-2xl bg-white border border-black/10 flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <Fingerprint className="w-5 h-5 text-muted-foreground" />
                                </button>
                            ) : (
                                <div className="h-14" />
                            )}
                            <button
                                onClick={() => handlePinInput("0")}
                                disabled={loading}
                                className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                            >
                                0
                            </button>
                            <button
                                onClick={() => setPin(p => p.slice(0, -1))}
                                disabled={loading}
                                className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                            >
                                ⌫
                            </button>
                        </div>

                        <button
                            onClick={() => { setSelectedUserId(null); setPin(""); setError(null); }}
                            className="w-full text-center font-mono text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                        >
                            ← Cambiar usuario
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
