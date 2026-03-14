"use client";

import { createElement, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, DollarSign, TrendingUp, Wallet, Pencil, X, icons, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { getBankById } from "@/lib/accounts/bankCatalog";
import type { Account } from "@/types";

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
    const { accounts, updateAccountBalance } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [balanceInput, setBalanceInput] = useState("");
    const [savingAccountId, setSavingAccountId] = useState<string | null>(null);
    const [adjustError, setAdjustError] = useState<string | null>(null);

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

    const currencySymbol = (currency: string) => CURRENCY_LABEL[currency] ?? "$";

    const openAdjustModal = (account: Account) => {
        setEditingAccount(account);
        setBalanceInput(account.balance.toString());
        setAdjustError(null);
    };

    const closeAdjustModal = () => {
        if (savingAccountId) return;
        setEditingAccount(null);
        setBalanceInput("");
        setAdjustError(null);
    };

    const handleAdjustBalance = async () => {
        if (!editingAccount) return;

        const nextBalance = Number.parseFloat(balanceInput);
        if (!Number.isFinite(nextBalance) || nextBalance < 0) {
            setAdjustError("Ingresa un saldo valido mayor o igual a 0.");
            return;
        }

        setSavingAccountId(editingAccount.id);
        setAdjustError(null);
        try {
            await updateAccountBalance(editingAccount.id, nextBalance);
            closeAdjustModal();
        } catch (error) {
            setAdjustError(error instanceof Error ? error.message : "No se pudo actualizar el saldo.");
        } finally {
            setSavingAccountId(null);
        }
    };

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
                onAdjustBalance={openAdjustModal}
            />

            <AccountSection
                title="Dolares"
                subtitle="Cuentas internacionales"
                accounts={groupedAccounts.international}
                rate={rate}
                toUSD={toUSD}
                onAdjustBalance={openAdjustModal}
            />

            <AnimatePresence>
                {editingAccount && (
                    <>
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/45"
                            onClick={closeAdjustModal}
                        />
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-3xl border border-black/10 bg-background p-5 shadow-2xl"
                        >
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                        Ajuste manual
                                    </p>
                                    <h2 className="font-mono text-lg font-bold uppercase tracking-tight">
                                        {editingAccount.name}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeAdjustModal}
                                    disabled={!!savingAccountId}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="paper-card rounded-2xl p-4">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                    Saldo correcto actual
                                </p>
                                <div className="mt-2 flex items-center gap-2 border-b border-black/10 pb-2">
                                    <span className="font-mono text-2xl font-bold">
                                        {currencySymbol(editingAccount.currency)}
                                    </span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        value={balanceInput}
                                        onChange={(event) => setBalanceInput(event.target.value)}
                                        className="w-full bg-transparent font-mono text-2xl font-bold outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                                    Este ajuste solo corrige el saldo guardado de la cuenta. No borra ni modifica tu historial.
                                </p>
                            </div>

                            {adjustError && (
                                <div className="mt-3 rounded-2xl border border-error/20 bg-error/5 p-3">
                                    <p className="font-mono text-[11px] text-error">{adjustError}</p>
                                </div>
                            )}

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={closeAdjustModal}
                                    disabled={!!savingAccountId}
                                    className="rounded-2xl border border-black/10 py-3 font-mono text-xs font-bold uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAdjustBalance}
                                    disabled={!!savingAccountId}
                                    className="rounded-2xl bg-foreground py-3 font-mono text-xs font-bold uppercase tracking-widest text-background disabled:opacity-40"
                                >
                                    {savingAccountId ? "Guardando..." : "Guardar saldo"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function AccountSection({
    title,
    subtitle,
    accounts,
    rate,
    toUSD,
    onAdjustBalance,
}: {
    title: string;
    subtitle: string;
    accounts: ReturnType<typeof useCurrentUser>["accounts"];
    rate: number;
    toUSD: (amount: number, currency: string) => number;
    onAdjustBalance: (account: Account) => void;
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
                                        <button
                                            type="button"
                                            onClick={() => onAdjustBalance(acc)}
                                            className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-black/10"
                                        >
                                            <Pencil className="h-3 w-3" />
                                            Ajustar
                                        </button>
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
