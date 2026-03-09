"use client";

import { createElement, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, DollarSign, TrendingUp, Wallet, icons, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { getBankById } from "@/lib/accounts/bankCatalog";

const iconRegistry = icons as Record<string, LucideIcon>;

const resolveIcon = (iconName?: string): LucideIcon => {
    if (!iconName) return iconRegistry.Wallet;
    return iconRegistry[iconName] ?? iconRegistry.Wallet;
};

const renderNamedIcon = (iconName: string, className: string) => {
    const Icon = resolveIcon(iconName);
    return createElement(Icon, { className });
};

const CURRENCY_LABEL: Record<string, string> = {
    USD: "$",
    USDT: "$",
    VES: "Bs.",
    EUR: "EUR ",
};

export default function AccountsPage() {
    const { accounts } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);

    const toUSD = (amount: number, currency: string) => {
        if (currency === "USD" || currency === "USDT") return amount;
        if (currency === "VES") return amount / rate;
        if (currency === "EUR") return amount * 1.08;
        return amount;
    };

    const totalUSD = accounts.reduce((sum, acc) => sum + toUSD(acc.balance, acc.currency), 0);
    const totalVES = totalUSD * rate;

    const groupedAccounts = useMemo(() => {
        const national = accounts
            .filter((acc) => acc.currency === "VES" || acc.account_scope === "national")
            .sort((a, b) => b.balance - a.balance);
        const international = accounts
            .filter((acc) => acc.currency !== "VES" && acc.account_scope !== "national")
            .sort((a, b) => b.balance - a.balance);
        return { national, international };
    }, [accounts]);

    return (
        <div className="pb-safe pt-4 space-y-6">
            <header className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">
                        Portafolio
                    </p>
                    <h1 className="text-2xl font-mono tracking-tighter font-bold uppercase">Mis Saldos</h1>
                </div>
                <Link
                    href="/accounts/new"
                    className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                </Link>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="paper-card rounded-2xl p-6 relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-black/5 border border-black/10 flex items-center justify-center">
                                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                                Total estimado
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                            <TrendingUp className="w-3 h-3 text-success" />
                            <span className="text-[10px] font-mono text-success font-bold">activo</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-baseline space-x-1.5">
                            <span className="text-2xl font-mono text-muted-foreground">$</span>
                            <span className="text-4xl font-mono font-bold tracking-tighter">
                                {totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">
                            ≈ Bs.{" "}
                            <span className="font-bold">
                                {totalVES.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="opacity-50 ml-1">(tasa Bs.{rate.toFixed(2)}/$)</span>
                        </p>
                    </div>
                </div>
            </motion.div>

            <AccountSection
                title="Bolivares"
                subtitle="Cuentas nacionales"
                accounts={groupedAccounts.national}
                rate={rate}
                toUSD={toUSD}
            />

            <AccountSection
                title="Dolares"
                subtitle="Cuentas internacionales"
                accounts={groupedAccounts.international}
                rate={rate}
                toUSD={toUSD}
            />
        </div>
    );
}

function AccountSection({
    title,
    subtitle,
    accounts,
    rate,
    toUSD,
}: {
    title: string;
    subtitle: string;
    accounts: ReturnType<typeof useCurrentUser>["accounts"];
    rate: number;
    toUSD: (amount: number, currency: string) => number;
}) {
    return (
        <section className="space-y-3">
            <div>
                <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{subtitle}</p>
                <h2 className="text-lg font-mono font-bold uppercase tracking-tight">{title}</h2>
            </div>

            {accounts.length === 0 ? (
                <div className="paper-card rounded-2xl p-5 text-center">
                    <Wallet className="w-5 h-5 mx-auto text-muted-foreground opacity-50 mb-2" />
                    <p className="font-mono text-xs uppercase text-muted-foreground opacity-60">
                        Sin cuentas en esta seccion
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map((acc, index) => {
                        const bank = getBankById(acc.bank_id);
                        const iconName = acc.display_icon || acc.icon || bank?.defaultIcon || "Wallet";
                        const symbol = CURRENCY_LABEL[acc.currency] ?? "$";
                        const showUsd = acc.currency === "VES";
                        const showVes = acc.currency === "USD";
                        const approx = showUsd ? `$${toUSD(acc.balance, acc.currency).toFixed(2)}` : `Bs.${(toUSD(acc.balance, acc.currency) * rate).toFixed(2)}`;

                        return (
                            <motion.div
                                key={acc.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: index * 0.04 }}
                                className="paper-card rounded-2xl p-4 border border-black/5"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-black/10 bg-white shrink-0">
                                            {(acc.logo_url || bank?.defaultLogoUrl) ? (
                                                <div
                                                    className="absolute inset-0 bg-center bg-no-repeat bg-contain"
                                                    style={{ backgroundImage: `url("${acc.logo_url || bank?.defaultLogoUrl}")` }}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                                    {renderNamedIcon(iconName, "w-5 h-5")}
                                                </div>
                                            )}
                                            <div
                                                className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full border border-white bg-background flex items-center justify-center"
                                                style={{ color: acc.color || bank?.brandColor || "#111111" }}
                                            >
                                                {renderNamedIcon(iconName, "w-3.5 h-3.5")}
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-mono text-sm font-bold uppercase truncate">{acc.name}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground truncate">
                                                {acc.provider || bank?.name || "Cuenta"} · {acc.account_scope === "national" ? "Nacional" : "Internacional"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="font-mono font-bold tracking-tighter text-base">
                                            {symbol}
                                            {acc.balance.toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                            {showUsd ? `≈ ${approx}` : showVes ? `≈ ${approx}` : acc.currency}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
