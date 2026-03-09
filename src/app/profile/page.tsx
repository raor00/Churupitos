"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuth";
import { isBiometricSupported } from "@/lib/auth/webauthn";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Fingerprint, Lock, CheckCircle, AlertCircle, ChevronRight, User, FileText } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Section = "main" | "change-pin" | "biometrics";

export default function ProfilePage() {
    const router = useRouter();
    const { getCurrentUser, changePin, setupBiometric, updateUser, logout } = useAuthStore();
    const user = getCurrentUser();
    const bioSupported = isBiometricSupported();

    const [section, setSection] = useState<Section>("main");

    // PIN change state
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [pinStep, setPinStep] = useState<"current" | "new" | "confirm">("current");
    const [confirmPin, setConfirmPin] = useState("");
    const [pinError, setPinError] = useState<string | null>(null);
    const [pinSuccess, setPinSuccess] = useState(false);

    // Biometric state
    const [bioLoading, setBioLoading] = useState(false);
    const [bioSuccess, setBioSuccess] = useState(false);
    const [bioError, setBioError] = useState<string | null>(null);

    if (!user) {
        router.replace("/auth");
        return null;
    }

    // ── PIN change logic ─────────────────────────────────────────────────────
    const activePin = pinStep === "current" ? currentPin : pinStep === "new" ? newPin : confirmPin;
    const setActivePin = (v: string) => {
        if (pinStep === "current") setCurrentPin(v);
        else if (pinStep === "new") setNewPin(v);
        else setConfirmPin(v);
    };

    const handlePinKey = (val: string) => {
        if (activePin.length >= 6) return;
        const next = activePin + val;
        setActivePin(next);
        setPinError(null);

        if (next.length === 6) {
            if (pinStep === "current") {
                setPinStep("new");
            } else if (pinStep === "new") {
                setPinStep("confirm");
            } else {
                // confirm step — submit
                submitPinChange(currentPin, newPin, next);
            }
        }
    };

    const handlePinDelete = () => setActivePin(activePin.slice(0, -1));

    const submitPinChange = async (cur: string, nw: string, conf: string) => {
        if (nw !== conf) {
            setPinError("Los PINs nuevos no coinciden.");
            setConfirmPin("");
            setPinStep("new");
            setNewPin("");
            return;
        }
        const ok = await changePin(user.id, cur, nw);
        if (ok) {
            setPinSuccess(true);
            setTimeout(() => {
                setPinSuccess(false);
                setSection("main");
                setCurrentPin(""); setNewPin(""); setConfirmPin("");
                setPinStep("current");
            }, 1800);
        } else {
            setPinError("PIN actual incorrecto.");
            setCurrentPin(""); setNewPin(""); setConfirmPin("");
            setPinStep("current");
        }
    };

    // ── Biometric setup ──────────────────────────────────────────────────────
    const handleSetupBiometric = async () => {
        setBioLoading(true);
        setBioError(null);
        const ok = await setupBiometric(user.id);
        setBioLoading(false);
        if (ok) {
            setBioSuccess(true);
            setTimeout(() => setBioSuccess(false), 2000);
        } else {
            setBioError("No se pudo activar el biométrico. Intenta de nuevo.");
        }
    };

    const pinLabel = {
        current: "Ingresa tu PIN actual",
        new: "Ingresa tu nuevo PIN",
        confirm: "Confirma tu nuevo PIN",
    }[pinStep];

    return (
        <div className="pb-safe pt-4 space-y-0 min-h-screen">
            {/* Header */}
            <header className="flex items-center space-x-3 mb-6">
                {section === "main" ? (
                    <Link href="/" className="p-2 rounded-full border border-black/10 hover:bg-black/5 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                ) : (
                    <button
                        onClick={() => {
                            setSection("main");
                            setCurrentPin(""); setNewPin(""); setConfirmPin("");
                            setPinStep("current"); setPinError(null); setPinSuccess(false);
                            setBioError(null); setBioSuccess(false);
                        }}
                        className="p-2 rounded-full border border-black/10 hover:bg-black/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div>
                    <h1 className="font-mono font-bold uppercase tracking-tight text-lg">
                        {section === "main" ? "Mi Perfil" : section === "change-pin" ? "Cambiar PIN" : "Biometría"}
                    </h1>
                    <p className="font-mono text-[10px] text-muted-foreground">
                        {section === "main" ? "Configuración y seguridad" : ""}
                    </p>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {/* ── MAIN SECTION ── */}
                {section === "main" && (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        {/* Avatar card */}
                        <div className="bg-white rounded-2xl border border-black/8 p-5 flex items-center space-x-4 shadow-sm">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-mono font-bold text-2xl shadow-md flex-shrink-0"
                                style={{ backgroundColor: user.color }}
                            >
                                {user.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-mono font-bold text-lg uppercase tracking-tight">{user.name}</p>
                                <p className="font-mono text-xs text-muted-foreground">@{user.username}</p>
                                <div className="flex items-center space-x-1 mt-1">
                                    {user.biometricEnabled ? (
                                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                            <Fingerprint className="w-3 h-3" />
                                            <span>Biométrico activo</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-muted-foreground bg-black/5 px-2 py-0.5 rounded-full">
                                            <Lock className="w-3 h-3" />
                                            <span>Solo PIN</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Security section */}
                        <div>
                            <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2 px-1">
                                Seguridad
                            </p>
                            <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm divide-y divide-black/5">
                                <button
                                    onClick={() => setSection("change-pin")}
                                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/3 transition-colors text-left"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center">
                                            <Lock className="w-4 h-4 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-mono font-bold text-sm">Cambiar PIN</p>
                                            <p className="font-mono text-[10px] text-muted-foreground">PIN de 6 dígitos</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </button>

                                {bioSupported && (
                                    <button
                                        onClick={() => setSection("biometrics")}
                                        className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/3 transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center">
                                                <Fingerprint className="w-4 h-4 text-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-mono font-bold text-sm">Face ID / Huella</p>
                                                <p className="font-mono text-[10px] text-muted-foreground">
                                                    {user.biometricEnabled ? "Activo — toca para reconfigurar" : "No configurado"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {user.biometricEnabled && (
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                            )}
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Account section */}
                        <div>
                            <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2 px-1">
                                Cuenta
                            </p>
                            <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm divide-y divide-black/5">
                                <Link
                                    href="/auth/register"
                                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/3 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center">
                                            <User className="w-4 h-4 text-foreground" />
                                        </div>
                                        <p className="font-mono font-bold text-sm">Nuevo usuario</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </Link>
                                <Link
                                    href="/privacy"
                                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/3 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-foreground" />
                                        </div>
                                        <p className="font-mono font-bold text-sm">Políticas de privacidad</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </Link>
                                <button
                                    onClick={() => { logout(); router.replace("/auth"); }}
                                    className="w-full flex items-center space-x-3 px-4 py-4 hover:bg-red-50 transition-colors text-red-500 text-left"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                                        <ArrowLeft className="w-4 h-4 text-red-500" />
                                    </div>
                                    <p className="font-mono font-bold text-sm">Cerrar sesión</p>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── CHANGE PIN SECTION ── */}
                {section === "change-pin" && (
                    <motion.div
                        key="pin"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {pinSuccess ? (
                            <div className="flex flex-col items-center space-y-4 py-12">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <CheckCircle className="w-16 h-16 text-green-500" />
                                </motion.div>
                                <p className="font-mono font-bold text-lg uppercase tracking-tight">PIN actualizado</p>
                            </div>
                        ) : (
                            <>
                                {/* Step indicator */}
                                <div className="flex justify-center space-x-2">
                                    {(["current", "new", "confirm"] as const).map((s, i) => (
                                        <div
                                            key={s}
                                            className={`h-1 rounded-full transition-all duration-300 ${
                                                s === pinStep ? "w-8 bg-foreground" :
                                                i < ["current", "new", "confirm"].indexOf(pinStep) ? "w-4 bg-foreground/40" :
                                                "w-4 bg-black/10"
                                            }`}
                                        />
                                    ))}
                                </div>

                                <div className="text-center space-y-3">
                                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{pinLabel}</p>
                                    <div className="flex justify-center space-x-3">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ scale: i < activePin.length ? 1.15 : 1 }}
                                                className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                                                    i < activePin.length ? "bg-foreground border-foreground" : "border-black/20"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <AnimatePresence>
                                        {pinError && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="font-mono text-[10px] text-red-500 flex items-center justify-center space-x-1"
                                            >
                                                <AlertCircle className="w-3 h-3" />
                                                <span>{pinError}</span>
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
                                            onClick={() => handlePinKey(n.toString())}
                                            className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 transition-all shadow-sm"
                                        >
                                            {n}
                                        </motion.button>
                                    ))}
                                    <div />
                                    <motion.button
                                        whileTap={{ scale: 0.88 }}
                                        onClick={() => handlePinKey("0")}
                                        className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 transition-all shadow-sm"
                                    >
                                        0
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.88 }}
                                        onClick={handlePinDelete}
                                        className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 transition-all shadow-sm"
                                    >
                                        ⌫
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* ── BIOMETRICS SECTION ── */}
                {section === "biometrics" && (
                    <motion.div
                        key="bio"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6 text-center pt-6"
                    >
                        <motion.div
                            animate={bioLoading ? { scale: [1, 1.08, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 transition-colors ${
                                bioSuccess ? "bg-green-50 border-green-300" :
                                bioLoading ? "bg-black/5 border-black/20" :
                                "bg-black/5 border-black/10"
                            }`}
                        >
                            {bioSuccess
                                ? <CheckCircle className="w-12 h-12 text-green-500" />
                                : <Fingerprint className={`w-12 h-12 ${bioLoading ? "text-foreground" : "text-muted-foreground"}`} />
                            }
                        </motion.div>

                        <div className="space-y-2">
                            <h2 className="font-mono font-bold uppercase text-lg tracking-tight">
                                {user.biometricEnabled ? "Reconfigurar biométrico" : "Activar Face ID / Huella"}
                            </h2>
                            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                                {bioSuccess
                                    ? "¡Biométrico configurado correctamente!"
                                    : "Usa tu huella dactilar o Face ID para entrar más rápido a Churupitos. Compatible con iPhone y Android."
                                }
                            </p>
                        </div>

                        <AnimatePresence>
                            {bioError && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-mono text-xs text-red-500 flex items-center justify-center space-x-1"
                                >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>{bioError}</span>
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {!bioSuccess && (
                            <button
                                onClick={handleSetupBiometric}
                                disabled={bioLoading}
                                className="w-full bg-foreground text-background font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {bioLoading ? "Esperando biométrico..." : user.biometricEnabled ? "Reconfigurar" : "Activar ahora"}
                            </button>
                        )}

                        <p className="font-mono text-[10px] text-muted-foreground opacity-60">
                            {bioSupported
                                ? "Tu dispositivo es compatible con autenticación biométrica"
                                : "Tu dispositivo no soporta biométrico"
                            }
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
