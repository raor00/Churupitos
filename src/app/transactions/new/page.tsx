"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTransactionSound } from "@/hooks/useTransactionSound";
import { ArrowLeft, ArrowRight, Delete, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const txSchema = z.object({
    amount: z.number().positive("El monto debe ser positivo"),
    transaction_currency: z.enum(["USD", "VES", "EUR", "USDT"]),
    account_id: z.string().min(1, "Selecciona una cuenta de pago"),
    description: z.string().min(3, "El concepto es muy corto"),
    category_id: z.string().min(1, "Selecciona una categoría"),
    notes: z.string().optional(),
});

type TxFormValues = z.infer<typeof txSchema>;

export default function NewTransactionWizard() {
    const router = useRouter();
    const { categories, addTransaction, accounts } = useCurrentUser();
    const { playExpenseSound, playIncomeSound } = useTransactionSound();

    const [step, setStep] = useState<1 | 2>(1);
    const [txType, setTxType] = useState<"expense" | "income">("expense");
    const [amountStr, setAmountStr] = useState("0");

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TxFormValues>({
        resolver: zodResolver(txSchema),
        defaultValues: {
            transaction_currency: "USD",
            account_id: accounts[0]?.id || "",
            amount: 0,
        }
    });

    const txCurrency = watch("transaction_currency");
    const filteredCategories = categories.filter(c => c.type === txType);
    const selectedAccountId = watch("account_id");
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    // Numpad handler
    const handleNumpad = (val: string) => {
        if (val === "delete") {
            setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
        } else if (val === ".") {
            if (!amountStr.includes(".")) setAmountStr(prev => prev + ".");
        } else {
            setAmountStr(prev => prev === "0" && val !== "." ? val : prev + val);
        }
    };

    const handleNextStep = () => {
        const num = parseFloat(amountStr);
        if (num > 0) {
            setValue("amount", num);
            setStep(2);
        }
    };

    const onSubmit = (data: TxFormValues) => {
        if (addTransaction && selectedAccount) {
            const rateToVES = data.transaction_currency === "VES" ? 1 : 45;
            const amountInVES = data.amount * rateToVES;

            addTransaction({
                type: txType,
                description: data.description,
                amount: data.amount,
                currency: data.transaction_currency,
                account_id: data.account_id,
                amount_ves: amountInVES,
                rate_used: rateToVES,
                rate_type: "manual",
                category_id: data.category_id,
                date: new Date().toISOString().split("T")[0],
                notes: data.notes,
            } as Parameters<typeof addTransaction>[0]);
            // Play sound before navigation
            if (txType === "expense") playExpenseSound();
            else playIncomeSound();

            router.push("/transactions");
        }
    };

    return (
        <div className="pb-24 pt-4 overflow-hidden min-h-screen">
            <header className="flex items-center space-x-4 mb-4">
                {step === 1 ? (
                    <Link href="/" className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors">
                        <X className="w-5 h-5" />
                    </Link>
                ) : (
                    <button onClick={() => setStep(1)} className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">
                    Nuevo Registro
                </h1>
            </header>

            {/* Type Selection Tabs */}
            <div className="flex bg-black/5 p-1 rounded-xl mx-2 mb-6 shadow-inner">
                {["expense", "income"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTxType(t as any)}
                        className={`flex-1 text-center py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all ${txType === t
                            ? t === "expense" ? "bg-white text-error shadow-sm" : "bg-white text-success shadow-sm"
                            : "text-muted-foreground hover:bg-black/5"
                            }`}
                    >
                        {t === "expense" ? "Gasto" : "Ingreso"}
                    </button>
                ))}
            </div>

            <div className="px-2 relative">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex flex-col items-center justify-between h-[65vh]"
                        >

                            <div className="w-full text-center space-y-4 pt-4">
                                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                                    ¿Cuánto dinero?
                                </p>
                                <div className="text-5xl font-mono tracking-tighter font-bold flex items-center justify-center overflow-hidden w-full px-4">
                                    <span className="text-muted-foreground mr-1 opacity-50 text-3xl">
                                        {txCurrency === "USD" ? "$" : txCurrency === "EUR" ? "€" : "Bs"}
                                    </span>
                                    {amountStr}
                                </div>

                                {/* Currency Selector */}
                                <div className="inline-flex gap-1 overflow-x-auto p-1 bg-black/5 rounded-full border border-black/5 max-w-full mx-auto">
                                    {["USD", "VES", "EUR", "USDT"].map((curr) => (
                                        <button
                                            key={curr}
                                            onClick={() => setValue("transaction_currency", curr as any)}
                                            className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold transition-all ${txCurrency === curr
                                                ? "bg-foreground text-background shadow-md"
                                                : "text-muted-foreground hover:bg-black/5"
                                                }`}
                                        >
                                            {curr}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Numpad */}
                            <div className="w-full max-w-sm grid grid-cols-3 gap-2 mt-8">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "delete"].map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => handleNumpad(key.toString())}
                                        className="h-16 rounded-2xl bg-white/50 backdrop-blur-sm border border-black/10 font-mono text-2xl font-bold flex items-center justify-center hover:bg-black/5 active:bg-black/10 active:scale-95 transition-all shadow-sm"
                                    >
                                        {key === "delete" ? <Delete className="w-6 h-6 text-muted-foreground" /> : key}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleNextStep}
                                disabled={parseFloat(amountStr) <= 0}
                                className="w-full max-w-sm mt-6 py-4 rounded-2xl bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest shadow-xl shadow-primary/20 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                Continuar <ArrowRight className="w-5 h-5 ml-2" />
                            </button>

                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                        >
                            <div className="paper-card p-6 rounded-3xl relative overflow-hidden">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10 w-full max-w-sm mx-auto">

                                    {/* Summary amount */}
                                    <div className="flex items-center justify-between border-b-2 border-dashed border-black/10 pb-4">
                                        <span className="font-mono text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                            Monto
                                        </span>
                                        <span className="font-mono text-2xl font-bold tracking-tighter">
                                            {txCurrency === "USD" ? "$" : txCurrency === "EUR" ? "€" : "Bs "}
                                            {amountStr}
                                        </span>
                                    </div>

                                    {/* Payment Account (Source) */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-mono uppercase text-muted-foreground font-bold tracking-widest">
                                            ¿Con qué lo pagaste?
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {accounts.map((acc) => (
                                                <label
                                                    key={acc.id}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-20 ${selectedAccountId === acc.id
                                                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                                                        : "border-black/10 bg-white/50 hover:bg-black/5"
                                                        }`}
                                                >
                                                    <input type="radio" value={acc.id} {...register("account_id")} className="hidden" />
                                                    <span className="font-mono text-xs font-bold line-clamp-1">{acc.name}</span>
                                                    <div className="flex justify-between items-end">
                                                        <span className="font-mono text-[9px] text-muted-foreground uppercase opacity-80">{acc.provider || "Cuenta"}</span>
                                                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 uppercase">{acc.currency}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {selectedAccount && selectedAccount.currency !== txCurrency && (
                                            <p className="text-[10px] font-mono text-muted-foreground bg-black/5 p-2 rounded-lg border border-black/5">
                                                ℹ️ Se descontará el equivalente de la cuenta en <strong>{selectedAccount.currency}</strong> a la tasa actual.
                                            </p>
                                        )}
                                        {errors.account_id && <p className="text-error text-[10px] font-mono mt-1">{errors.account_id.message}</p>}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <input
                                            {...register("description")}
                                            className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-lg p-2 transition-colors outline-none placeholder:text-black/30"
                                            placeholder="Concepto (Ej. Sushi)"
                                        />
                                        {errors.description && <p className="text-error text-[10px] font-mono mt-1">{errors.description.message}</p>}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <select
                                            {...register("category_id")}
                                            className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-base p-2 transition-colors outline-none appearance-none"
                                        >
                                            <option value="">Selecciona Categoría...</option>
                                            {filteredCategories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        {errors.category_id && <p className="text-error text-[10px] font-mono mt-1">{errors.category_id.message}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-foreground text-background font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-foreground/90 transition-colors mt-4"
                                    >
                                        Guardar
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
