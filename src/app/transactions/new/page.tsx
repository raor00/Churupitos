"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTransactionStore } from "@/lib/store/useTransactions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const txSchema = z.object({
    amount: z.number().positive("El monto debe ser positivo"),
    account_id: z.string().min(1, "Selecciona una cuenta"),
    description: z.string().min(3, "El concepto es muy corto"),
    category_id: z.string().min(1, "Selecciona una categoría"),
    notes: z.string().optional(),
});

type TxFormValues = z.infer<typeof txSchema>;

export default function NewTransactionPage() {
    const router = useRouter();
    const { categories, addTransaction, accounts } = useTransactionStore();

    const [txType, setTxType] = useState<"expense" | "income">("expense");

    const { register, handleSubmit, watch, formState: { errors } } = useForm<TxFormValues>({
        resolver: zodResolver(txSchema),
        defaultValues: {
            account_id: accounts[0]?.id || "",
        }
    });

    const filteredCategories = categories.filter(c => c.type === txType);
    const selectedAccountId = watch("account_id");
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    const onSubmit = (data: TxFormValues) => {
        if (addTransaction && selectedAccount) {
            addTransaction({
                user_id: "temp-user",
                type: txType,
                description: data.description,
                amount: data.amount,
                currency: selectedAccount.currency,
                account_id: data.account_id,
                amount_ves: selectedAccount.currency === "VES" ? data.amount : data.amount * 45, // Mock rate
                rate_used: 45,
                rate_type: "manual",
                category_id: data.category_id,
                date: new Date().toISOString().split('T')[0],
                notes: data.notes
            });
            router.push("/transactions");
        }
    };

    return (
        <div className="pb-24 pt-4">
            <header className="flex items-center space-x-4 mb-8">
                <Link href="/" className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">
                    Nuevo Registro
                </h1>
            </header>

            <div className="paper-card p-6 rounded-2xl relative overflow-hidden">
                {/* Subtle noise texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10 w-full max-w-sm mx-auto">

                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 rounded-lg">
                        {["expense", "income"].map((t) => (
                            <label
                                key={t}
                                className={`text-center py-2 rounded-md font-mono text-sm capitalize transition-all cursor-pointer ${txType === t
                                        ? t === "expense" ? "bg-white text-error shadow-sm border border-black/10" : "bg-white text-success shadow-sm border border-black/10"
                                        : "text-muted-foreground hover:bg-black/5"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="type"
                                    value={t}
                                    checked={txType === t}
                                    onChange={() => setTxType(t as "expense" | "income")}
                                    className="hidden"
                                />
                                {t === "expense" ? "Gasto" : "Ingreso"}
                            </label>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {/* Amount & Account */}
                        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                            <div>
                                <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1">Monto</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register("amount", { valueAsNumber: true })}
                                    className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary text-3xl font-mono p-2 transition-colors outline-none"
                                    placeholder="0.00"
                                />
                                {errors.amount && <p className="text-error text-xs font-mono mt-1">{errors.amount.message}</p>}
                            </div>
                            <div>
                                <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1">Cuenta</label>
                                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide pt-1">
                                    {accounts.map((acc) => (
                                        <label
                                            key={acc.id}
                                            className={`px-3 py-1.5 rounded-md font-mono text-sm capitalize transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${selectedAccountId === acc.id
                                                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                                                    : "bg-black/5 text-muted-foreground hover:bg-black/10"
                                                }`}
                                        >
                                            <input type="radio" value={acc.id} {...register("account_id")} className="hidden" />
                                            {acc.name}
                                        </label>
                                    ))}
                                </div>
                                {errors.account_id && <p className="text-error text-xs font-mono mt-1">{errors.account_id.message}</p>}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1">Concepto</label>
                            <input
                                {...register("description")}
                                className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono p-2 transition-colors outline-none"
                                placeholder="¿En qué gastaste o recibiste?"
                            />
                            {errors.description && <p className="text-error text-xs font-mono mt-1">{errors.description.message}</p>}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1">Categoría</label>
                            <select
                                {...register("category_id")}
                                className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono p-2 transition-colors outline-none appearance-none"
                            >
                                <option value="">Selecciona Categoría...</option>
                                {filteredCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-error text-xs font-mono mt-1">{errors.category_id.message}</p>}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1">Notas (Opcional)</label>
                            <textarea
                                {...register("notes")}
                                className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono p-2 transition-colors outline-none resize-none h-20"
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-colors mt-4"
                    >
                        Guardar Registro
                    </button>
                </form>
            </div>
        </div>
    );
}
