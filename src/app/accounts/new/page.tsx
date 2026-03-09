"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { icons, type LucideIcon, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import {
    ACCOUNT_ICON_OPTIONS,
    ACCOUNT_SCOPE_OPTIONS,
    getBankById,
    getBanksByScope,
    type BankScope,
} from "@/lib/accounts/bankCatalog";

const iconRegistry = icons as Record<string, LucideIcon>;

const accountSchema = z.object({
    account_scope: z.enum(["national", "international"]),
    bank_id: z.string().min(1, "Selecciona un banco o proveedor"),
    name: z.string().min(3, "Nombre muy corto"),
    currency: z.enum(["USD", "VES", "EUR", "USDT"]),
    logo_url: z.string().optional(),
    display_icon: z.string().min(1, "Selecciona un icono"),
    balance: z.number().min(0, "El saldo no puede ser negativo"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const resolveIcon = (iconName?: string): LucideIcon => {
    if (!iconName) return iconRegistry.Wallet;
    return iconRegistry[iconName] ?? iconRegistry.Wallet;
};

const currencySymbol = (currency: AccountFormValues["currency"]) => {
    if (currency === "VES") return "Bs.";
    if (currency === "EUR") return "EUR";
    return "$";
};

export default function NewAccountPage() {
    const router = useRouter();
    const { addAccount } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<AccountFormValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            account_scope: "international",
            bank_id: "",
            name: "",
            currency: "USD",
            logo_url: "",
            display_icon: "Wallet",
            balance: 0,
        },
    });

    const scope = watch("account_scope");
    const bankId = watch("bank_id");
    const currency = watch("currency");
    const balance = watch("balance") ?? 0;
    const logoUrl = watch("logo_url");
    const displayIcon = watch("display_icon");
    const formName = watch("name");

    const availableBanks = useMemo(() => getBanksByScope(scope), [scope]);
    const selectedBank = getBankById(bankId);
    const availableCurrencies = selectedBank?.supportedCurrencies ?? (scope === "national" ? ["VES"] : ["USD", "USDT", "EUR"]);
    const previewLogo = logoUrl?.trim() || selectedBank?.defaultLogoUrl;
    const PreviewIcon = resolveIcon(displayIcon || selectedBank?.defaultIcon);

    const usdEquiv = currency === "VES" ? balance / rate : null;
    const vesEquiv = currency === "USD" ? balance * rate : null;
    const usdtAsUsd = currency === "USDT" ? balance : null;

    const onSelectScope = (nextScope: BankScope) => {
        setValue("account_scope", nextScope, { shouldValidate: true });
        setValue("bank_id", "", { shouldValidate: true });
        setValue("name", "");
        setValue("logo_url", "");
        const defaultCurrency = nextScope === "national" ? "VES" : "USD";
        setValue("currency", defaultCurrency, { shouldValidate: true });
        setValue("display_icon", nextScope === "national" ? "Landmark" : "Wallet");
    };

    const onSelectBank = (nextBankId: string) => {
        const bank = getBankById(nextBankId);
        if (!bank) return;
        setValue("bank_id", bank.id, { shouldValidate: true });
        setValue("currency", bank.supportedCurrencies[0], { shouldValidate: true });
        setValue("display_icon", bank.defaultIcon, { shouldValidate: true });
        if (!formName.trim()) {
            setValue("name", bank.name, { shouldValidate: true });
        }
        if (!logoUrl?.trim()) {
            setValue("logo_url", bank.defaultLogoUrl ?? "");
        }
    };

    const onSubmit = async (data: AccountFormValues) => {
        const bank = getBankById(data.bank_id);
        await addAccount({
            name: data.name,
            provider: bank?.name ?? data.name,
            bank_id: data.bank_id,
            account_scope: data.account_scope,
            logo_url: data.logo_url?.trim() || bank?.defaultLogoUrl,
            display_icon: data.display_icon,
            icon: data.display_icon,
            color: bank?.brandColor ?? "#666666",
            currency: data.currency,
            balance: data.balance,
        });
        router.push("/accounts");
    };

    return (
        <div className="pb-28 pt-4">
            <header className="flex items-center space-x-4 mb-6">
                <Link
                    href="/accounts"
                    className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">Nueva Cuenta</h1>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Nacional o internacional
                    </p>
                </div>
            </header>

            <div className="paper-card p-5 rounded-2xl relative overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm mx-auto">
                    <div className="grid grid-cols-2 gap-2">
                        {ACCOUNT_SCOPE_OPTIONS.map((option) => {
                            const OptionIcon = option.icon;
                            const active = scope === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onSelectScope(option.id)}
                                    className={`rounded-2xl border p-3 text-left transition-all ${
                                        active
                                            ? "border-primary bg-primary/10 shadow-sm"
                                            : "border-black/10 bg-white/50 hover:bg-black/5"
                                    }`}
                                >
                                    <OptionIcon className="w-5 h-5 mb-2 text-muted-foreground" />
                                    <p className="font-mono text-sm font-bold uppercase">{option.label}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground mt-1">{option.description}</p>
                                </button>
                            );
                        })}
                    </div>

                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 mb-2 block tracking-widest">
                            {scope === "national" ? "Banco nacional" : "Banco o proveedor"}
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                            {availableBanks.map((bank) => {
                                const active = bank.id === bankId;
                                const BankIcon = resolveIcon(bank.defaultIcon);
                                return (
                                    <button
                                        key={bank.id}
                                        type="button"
                                        onClick={() => onSelectBank(bank.id)}
                                        className={`rounded-2xl border p-3 text-left transition-all ${
                                            active
                                                ? "border-primary bg-primary/10 shadow-sm"
                                                : "border-black/10 bg-white/50 hover:bg-black/5"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{
                                                    backgroundColor: `${bank.brandColor}20`,
                                                    color: bank.brandColor,
                                                }}
                                            >
                                                <BankIcon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-mono text-xs font-bold truncate">{bank.name}</p>
                                                <p className="font-mono text-[9px] uppercase text-muted-foreground">
                                                    {bank.supportedCurrencies.join(" · ")}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.bank_id && <p className="text-error text-[10px] font-mono mt-1">{errors.bank_id.message}</p>}
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white/50 p-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border border-black/10 bg-white"
                                style={
                                    previewLogo
                                        ? {
                                            backgroundImage: `url("${previewLogo}")`,
                                            backgroundSize: "contain",
                                            backgroundPosition: "center",
                                            backgroundRepeat: "no-repeat",
                                        }
                                        : undefined
                                }
                            >
                                {!previewLogo && <PreviewIcon className="w-6 h-6 text-muted-foreground" />}
                            </div>
                            <div className="min-w-0">
                                <p className="font-mono text-sm font-bold truncate">
                                    {formName || selectedBank?.name || "Vista previa"}
                                </p>
                                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                                    {selectedBank?.name || "Selecciona un banco"} · {currency}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">
                            Nombre de la cuenta
                        </label>
                        <input
                            {...register("name")}
                            className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-xl p-2 transition-colors outline-none placeholder:text-black/25"
                            placeholder={scope === "national" ? "Ej. Banesco Nomina" : "Ej. Wise Personal"}
                        />
                        {errors.name && <p className="text-error text-[10px] font-mono mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">
                            Moneda
                        </label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 pt-2">
                            {availableCurrencies.map((itemCurrency) => {
                                const active = currency === itemCurrency;
                                return (
                                    <button
                                        key={itemCurrency}
                                        type="button"
                                        onClick={() => setValue("currency", itemCurrency, { shouldValidate: true })}
                                        className={`px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all whitespace-nowrap ${
                                            active
                                                ? "bg-foreground text-background shadow-sm"
                                                : "bg-black/5 text-muted-foreground hover:bg-black/10"
                                        }`}
                                    >
                                        {itemCurrency}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">
                            URL del logo
                        </label>
                        <input
                            {...register("logo_url")}
                            className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-sm p-2 transition-colors outline-none placeholder:text-black/25"
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 mb-2 block tracking-widest">
                            Icono adicional
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {ACCOUNT_ICON_OPTIONS.map((option) => {
                                const Icon = resolveIcon(option.icon);
                                const active = displayIcon === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setValue("display_icon", option.id, { shouldValidate: true })}
                                        className={`rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                                            active
                                                ? "border-primary bg-primary/10 shadow-sm"
                                                : "border-black/10 bg-white/50 hover:bg-black/5"
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-mono text-[9px] uppercase text-center">{option.label}</span>
                                        {active && <Check className="w-3.5 h-3.5 text-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">
                            Saldo actual <span className="opacity-50 normal-case">({currencySymbol(currency)})</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register("balance", { valueAsNumber: true })}
                            className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-2xl font-bold p-2 transition-colors outline-none placeholder:text-black/25"
                            placeholder="0.00"
                        />
                        {errors.balance && <p className="text-error text-[10px] font-mono mt-1">{errors.balance.message}</p>}

                        {balance > 0 && (
                            <div className="mt-2 px-3 py-2 rounded-lg bg-black/5 border border-black/5">
                                {usdEquiv !== null && (
                                    <p className="font-mono text-[10px] text-muted-foreground">
                                        ≈ <span className="font-bold text-foreground">${usdEquiv.toFixed(2)}</span> USD
                                    </p>
                                )}
                                {vesEquiv !== null && (
                                    <p className="font-mono text-[10px] text-muted-foreground">
                                        ≈ <span className="font-bold text-foreground">Bs.{vesEquiv.toFixed(2)}</span>
                                    </p>
                                )}
                                {usdtAsUsd !== null && (
                                    <p className="font-mono text-[10px] text-muted-foreground">
                                        ≈ <span className="font-bold text-foreground">${usdtAsUsd.toFixed(2)}</span> USD (1:1 con USDT)
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
