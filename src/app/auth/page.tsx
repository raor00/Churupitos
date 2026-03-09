"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuth";
import { useTransactionStore } from "@/lib/store/useTransactions";
import { useRouter } from "next/navigation";
import { isBiometricSupported } from "@/lib/auth/webauthn";
import { Plus, Lock, Fingerprint, User, CheckCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Screen = "users" | "pin" | "loading" | "success";

export default function AuthPage() {
    const router = useRouter();
    const { users, loginWithPin, loginWithBiometric } = useAuthStore();
    const { seedForUser } = useTransactionStore();

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [pin, setPin] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [screen, setScreen] = useState<Screen>("users");

    const selectedUser = users.find(u => u.id === selectedUserId);
    const bioSupported = isBiometricSupported();

    const handlePinInput = (val: string) => {
        if (pin.length >= 6 || screen !== "pin") return;
        const next = pin + val;
        setPin(next);
        setError(null);
        if (next.length === 6) submitPin(next);
    };

    const handleSuccess = async (userId: string) => {
        setScreen("loading");
        const _resolvedId = userId === "rafa-default" ? "f6f1f8a4-47d8-4c13-9123-b8f7cf2fe001" : userId; await seedForUser(_resolvedId);
        // Brief loading delay for UX
        await new Promise(r => setTimeout(r, 900));
        setScreen("success");
        await new Promise(r => setTimeout(r, 600));
        router.replace("/");
    };

    const submitPin = async (p: string) => {
        if (!selectedUserId) return;
        setScreen("loading");
        const ok = await loginWithPin(selectedUserId, p);
        if (ok) {
            await handleSuccess(selectedUserId);
        } else {
            setScreen("pin");
            setError("PIN incorrecto. Intenta de nuevo.");
            setPin("");
        }
    };

    const handleBiometric = async () => {
        if (!selectedUserId) return;
        setScreen("loading");
        const ok = await loginWithBiometric(selectedUserId);
        if (ok) {
            await handleSuccess(selectedUserId);
        } else {
            setScreen("pin");
            setError("Autenticación biométrica fallida.");
        }
    };

    const selectUser = (id: string) => {
        setSelectedUserId(id);
        setPin("");
        setError(null);
        setScreen("pin");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
            {/* Logo */}
            <motion.div
                className="mb-10 text-center"
                animate={{ opacity: screen === "loading" || screen === "success" ? 0.4 : 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center font-mono font-bold text-xl mx-auto mb-3 shadow-lg">
                    C.
                </div>
                <h1 className="text-2xl font-mono font-bold tracking-tighter uppercase">Churupitos</h1>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                    {selectedUser && screen === "pin" ? `Hola, ${selectedUser.name}` : "¿Quién eres?"}
                </p>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* LOADING screen */}
                {(screen === "loading" || screen === "success") && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center space-y-6"
                    >
                        {/* User avatar */}
                        <motion.div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-mono font-bold text-3xl shadow-xl"
                            style={{ backgroundColor: selectedUser?.color }}
                            animate={screen === "loading" ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                        >
                            {screen === "success"
                                ? <CheckCircle className="w-9 h-9 text-white" />
                                : selectedUser?.name[0].toUpperCase()
                            }
                        </motion.div>

                        {screen === "loading" ? (
                            <>
                                {/* Spinner ring */}
                                <div className="relative w-12 h-12">
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-black/10"
                                    />
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground"
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                                    />
                                </div>
                                <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest">
                                    Verificando...
                                </p>
                            </>
                        ) : (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-mono text-sm font-bold uppercase tracking-widest"
                            >
                                ¡Bienvenido, {selectedUser?.name}!
                            </motion.p>
                        )}
                    </motion.div>
                )}

                {/* USER LIST */}
                {screen === "users" && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="w-full max-w-xs space-y-3"
                    >
                        {users.map((u) => (
                            <motion.button
                                key={u.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => selectUser(u.id)}
                                className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-white border border-black/10 hover:bg-black/5 transition-all shadow-sm"
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
                            </motion.button>
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
                )}

                {/* PIN entry */}
                {screen === "pin" && (
                    <motion.div
                        key="pin"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="w-full max-w-xs space-y-6"
                    >
                        {/* User avatar */}
                        <div className="flex flex-col items-center space-y-2">
                            <motion.div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-mono font-bold text-2xl shadow-md"
                                style={{ backgroundColor: selectedUser?.color }}
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                {selectedUser?.name[0].toUpperCase()}
                            </motion.div>
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
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: i < pin.length ? 1.15 : 1,
                                            backgroundColor: i < pin.length ? "#111" : "transparent",
                                        }}
                                        className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                                            i < pin.length ? "border-foreground" : "border-black/20"
                                        }`}
                                    />
                                ))}
                            </div>
                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        key="err"
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center font-mono text-[10px] text-red-500 mt-2"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Numpad */}
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <motion.button
                                    key={n}
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() => handlePinInput(n.toString())}
                                    className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:bg-black/10 transition-all shadow-sm"
                                >
                                    {n}
                                </motion.button>
                            ))}
                            {/* Bottom row: biometric | 0 | delete */}
                            {selectedUser?.biometricEnabled && bioSupported ? (
                                <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={handleBiometric}
                                    className="h-14 rounded-2xl bg-white border border-black/10 flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all shadow-sm"
                                >
                                    <Fingerprint className="w-5 h-5 text-muted-foreground" />
                                </motion.button>
                            ) : (
                                <div className="h-14" />
                            )}
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => handlePinInput("0")}
                                className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:bg-black/10 transition-all shadow-sm"
                            >
                                0
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => setPin(p => p.slice(0, -1))}
                                className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:bg-black/10 transition-all shadow-sm"
                            >
                                ⌫
                            </motion.button>
                        </div>

                        <button
                            onClick={() => { setSelectedUserId(null); setPin(""); setError(null); setScreen("users"); }}
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
