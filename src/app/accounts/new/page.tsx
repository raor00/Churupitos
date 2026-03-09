"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const accountSchema = z.object({
    name: z.string().min(3, "Nombre muy corto"),
    provider: z.string().optional(),
    currency: z.enum(["USD", "VES", "EUR", "USDT"]),
    color: z.string().optional(),
    balance: z.number().min(0, "El saldo no puede ser negativo"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const PROVIDERS = [
    { id: "Binance", name: "Binance", color: "#FCD535", icon: "Wallet", currencies: ["USDT", "USD"] },
    { id: "Banesco", name: "Banesco", color: "#00693C", icon: "Landmark", currencies: ["VES"] },
    { id: "Mercantil", name: "Mercantil", color: "#004B87", icon: "Landmark", currencies: ["VES", "USD"] },
    { id: "Zinli", name: "Zinli", color: "#E01F4E", icon: "CreditCard", currencies: ["USD"] },
    { id: "Zelle", name: "Zelle", color: "#741EE8", icon: "Send", currencies: ["USD"] },
    { id: "Efectivo", name: "Efectivo", color: "#16a34a", icon: "Banknote", currencies: ["USD", "VES", "EUR"] },
];

export default function NewAccountPage() {
    const router = useRouter();
    const { addAccount } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);

    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AccountFormValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            currency: "USD",
            balance: 0,
        },
    });

    const currency = watch("currency");
    const balance = watch("balance") ?? 0;

    const usdEquiv = currency === "VES" ? balance / rate : null;
    const vesEquiv = (currency === "USD" || currency === "USDT") ? balance * rate : null;

    const onSubmit = (data: AccountFormValues) => {
        const providerObj = PROVIDERS.find(p => p.id === selectedProvider);
        addAccount({
            name: data.name,
            currency: data.currency,
            provider: providerObj ? providerObj.name : data.provider,
            icon: providerObj ? providerObj.icon : "Wallet",
            color: providerObj ? providerObj.color : data.color || "#666",
            balance: data.balance,
        });
        router.push("/accounts");
    };

    const handleProviderSelect = (pid: string) => {
        setSelectedProvider(pid);
        const provider = PROVIDERS.find(p => p.id === pid);
        if (provider) {
            if (!watch("name")) setValue("name", provider.name);
            setValue("provider", provider.name);
            setValue("color", provider.color);
            if (!provider.currencies.includes(watch("currency"))) {
                setValue("currency", provider.currencies[0] as AccountFormValues["currency"]);
            }
        }
    };

    return (
        <div className="pb-28 pt-4">
            <header className="flex items-center space-x-4 mb-8">
                <Link
                    href="/accounts"
                    className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">
                    Nueva Cuenta
                </h1>
            </header>

            <div className="paper-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 relative z-10 w-full max-w-sm mx-auto">

                    {/* Quick Provider Selection */}
                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 mb-2 block tracking-widest">
                            Proveedor
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {PROVIDERS.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleProviderSelect(p.id)}
                                    style={{
                                        backgroundColor: selectedProvider === p.id ? p.color : "rgba(0,0,0,0.04)",
                                        color: selectedProvider === p.id ? "#fff" : "currentColor",
                                    }}
                                    className={`py-2.5 px-1 rounded-xl font-mono text-xs border transition-all ${
                                        selectedProvider === p.id
                                            ? "border-transparent shadow-md font-bold scale-[1.03]"
                                            : "border-black/5 hover:bg-black/8 active:scale-95"
                                    }`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">
                            Nombre
                        </label>
                        <input
                            {...register("name")}
                            className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-xl p-2 transition-colors outline-none placeholder:text-black/25"
                            placeholder="Ej. Binance Spot"
                        />
                        {errors.name && (
                            <p className="text-error text-[10px] font-mono mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">
                            Moneda
                        </label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 pt-2 scrollbar-hide">
                            {["USD", "VES", "EUR", "USDT"].map((curr) => {
                                const allowed =
                                    !selectedProvider ||
                                    PROVIDERS.find(p => p.id === selectedProvider)?.currencies.includes(curr);
                                const isSelected = watch("currency") === curr;

                                return (
                                    <label
                                        key={curr}
                                        className={`px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                                            !allowed ? "opacity-25 cursor-not-allowed" : ""
                                        } ${
                                            isSelected
                                                ? "bg-foreground text-background shadow-sm"
                                                : "bg-black/5 text-muted-foreground hover:bg-black/10"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            value={curr}
                                            {...register("currency")}
                                            disabled={!allowed}
                                            className="hidden"
                                        />
                                        {curr}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Initial Balance */}
                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">
                            Saldo Actual{" "}
                            <span className="opacity-50 normal-case">
                                ({currency === "VES" ? "Bs." : currency === "EUR" ? "€" : "$"})
                            </span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register("balance", { valueAsNumber: true })}
                            className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-2xl font-bold p-2 transition-colors outline-none placeholder:text-black/25"
                            placeholder="0.00"
                        />
                        {errors.balance && (
                            <p className="text-error text-[10px] font-mono mt-1">{errors.balance.message}</p>
                        )}

                        {/* Conversion hint */}
                        {balance > 0 && (
                            <div className="mt-2 px-3 py-2 rounded-lg bg-black/5 border border-black/5">
                                {usdEquiv !== null && (
                                    <p className="font-mono text-[10px] text-muted-foreground">
                                        ≈{" "}
                                        <span className="font-bold text-foreground">
                                            ${usdEquiv.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>{" "}
                                        USD · tasa Bs.{rate.toFixed(2)}/$
                                    </p>
                                )}
                                {vesEquiv !== null && (
                                    <p className="font-mono text-[10px] text-muted-foreground">
                                        ≈{" "}
                                        <span className="font-bold text-foreground">
                                            Bs.{vesEquiv.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>{" "}
                                        · tasa Bs.{rate.toFixed(2)}/$
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all mt-4"
                    >
                        Crear Cuenta
                    </button>
                </form>
            </div>
        </div>
    );
}
