"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/useAuth";
import { useTransactionStore } from "@/lib/store/useTransactions";
import { isBiometricSupported } from "@/lib/auth/webauthn";
import { ArrowLeft, Check, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COLORS = [
    "#111111", "#cc0000", "#00693C", "#741EE8",
    "#FCD535", "#004B87", "#E01F4E", "#F97316",
];

export default function RegisterPage() {
    const router = useRouter();
    const { register, setupBiometric } = useAuthStore();
    const { seedForUser } = useTransactionStore();

    const [step, setStep] = useState<"info" | "pin" | "pin-confirm" | "bio">("info");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [colorIdx, setColorIdx] = useState(0);
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");
    const [pinError, setPinError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [newUserId, setNewUserId] = useState<string | null>(null);

    const bioSupported = isBiometricSupported();

    const handleInfoNext = () => {
        if (!name.trim() || !username.trim()) return;
        setStep("pin");
    };

    const handlePinInput = (val: string, which: "first" | "confirm") => {
        const current = which === "first" ? pin : pinConfirm;
        if (current.length >= 6) return;
        const next = current + val;
        if (which === "first") setPin(next);
        else setPinConfirm(next);
        if (next.length === 6 && which === "first") setStep("pin-confirm");
    };

    const handlePinDelete = (which: "first" | "confirm") => {
        if (which === "first") setPin(p => p.slice(0, -1));
        else setPinConfirm(p => p.slice(0, -1));
    };

    const handleFinish = async () => {
        if (pin !== pinConfirm) {
            setPinError("Los PINs no coinciden.");
            setPinConfirm("");
            setStep("pin");
            setPin("");
            return;
        }
        setLoading(true);
        const user = await register(name.trim(), username.trim(), pin, colorIdx);
        await seedForUser(user.id);
        setNewUserId(user.id);
        setLoading(false);
        if (bioSupported) {
            setStep("bio");
        } else {
            router.replace("/auth");
        }
    };

    const handleSetupBio = async () => {
        if (!newUserId) return;
        setLoading(true);
        await setupBiometric(newUserId);
        setLoading(false);
        router.replace("/auth");
    };

    const currentPin = step === "pin" ? pin : pinConfirm;
    const isPinStep = step === "pin" || step === "pin-confirm";

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-xs">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-10">
                    <Link href="/auth" className="p-2 rounded-full border border-black/10 hover:bg-black/5 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-mono font-bold uppercase tracking-tight text-lg">Nuevo usuario</h1>
                        <p className="font-mono text-[10px] text-muted-foreground uppercase">
                            {step === "info" ? "1/3 · Datos" : step === "pin" ? "2/3 · PIN" : step === "pin-confirm" ? "2/3 · Confirmar" : "3/3 · Biométrico"}
                        </p>
                    </div>
                </div>

                {/* Step: Info */}
                {step === "info" && (
                    <div className="space-y-6">
                        {/* Color picker */}
                        <div>
                            <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest block mb-2">
                                Color de avatar
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map((c, i) => (
                                    <button
                                        key={c}
                                        onClick={() => setColorIdx(i)}
                                        className="w-9 h-9 rounded-full transition-transform active:scale-90"
                                        style={{ backgroundColor: c }}
                                    >
                                        {colorIdx === i && (
                                            <Check className="w-4 h-4 text-white mx-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="flex justify-center">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-mono font-bold text-3xl shadow-md transition-all"
                                style={{ backgroundColor: COLORS[colorIdx] }}
                            >
                                {name ? name[0].toUpperCase() : "?"}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                                Nombre completo
                            </label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-xl p-2 outline-none placeholder:text-black/25"
                                placeholder="Ej. Carlos"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                                Usuario
                            </label>
                            <div className="flex items-center border-b-2 border-black/20 focus-within:border-primary transition-colors">
                                <span className="font-mono text-muted-foreground px-2 pb-1">@</span>
                                <input
                                    value={username}
                                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                                    className="flex-1 bg-transparent font-mono text-xl p-2 outline-none placeholder:text-black/25"
                                    placeholder="carlos123"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleInfoNext}
                            disabled={!name.trim() || !username.trim()}
                            className="w-full bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40"
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* Step: PIN / PIN confirm */}
                {isPinStep && (
                    <div className="space-y-6">
                        <div className="text-center space-y-4">
                            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                                {step === "pin" ? "Crea tu PIN de 6 dígitos" : "Confirma tu PIN"}
                            </p>
                            {pinError && <p className="font-mono text-[10px] text-error">{pinError}</p>}
                            <div className="flex justify-center space-x-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                            i < currentPin.length
                                                ? "bg-foreground border-foreground scale-110"
                                                : "border-black/20"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                <button
                                    key={n}
                                    onClick={() => handlePinInput(n.toString(), step === "pin" ? "first" : "confirm")}
                                    className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:scale-95 transition-all shadow-sm"
                                >
                                    {n}
                                </button>
                            ))}
                            <div />
                            <button
                                onClick={() => handlePinInput("0", step === "pin" ? "first" : "confirm")}
                                className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:scale-95 transition-all shadow-sm"
                            >
                                0
                            </button>
                            <button
                                onClick={() => handlePinDelete(step === "pin" ? "first" : "confirm")}
                                className="h-14 rounded-2xl bg-white border border-black/10 font-mono text-xl font-bold hover:bg-black/5 active:scale-95 transition-all shadow-sm"
                            >
                                ⌫
                            </button>
                        </div>

                        {step === "pin-confirm" && pinConfirm.length === 6 && (
                            <button
                                onClick={handleFinish}
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? "Creando..." : "Crear cuenta"}
                            </button>
                        )}
                    </div>
                )}

                {/* Step: Biometric */}
                {step === "bio" && (
                    <div className="space-y-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mx-auto border border-black/10">
                            <Fingerprint className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="font-mono font-bold uppercase text-lg tracking-tight">Face ID / Huella</h2>
                            <p className="font-mono text-xs text-muted-foreground mt-2">
                                Activa el acceso biométrico para entrar más rápido.
                            </p>
                        </div>
                        <button
                            onClick={handleSetupBio}
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? "Configurando..." : "Activar biométrico"}
                        </button>
                        <button
                            onClick={() => router.replace("/auth")}
                            className="w-full font-mono text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                        >
                            Omitir por ahora
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
