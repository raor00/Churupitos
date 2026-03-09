"use client";

import { createElement, useMemo, useState, type ReactNode } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plus, Tag, icons, type LucideIcon } from "lucide-react";
import {
    SIN_CATEGORIA,
    categoryIdentity,
    getCategoryVisual,
    groupExpenseCategories,
    isLegacyDefaultCategory,
    sortCategoriesByPreset,
} from "@/lib/categories/catalog";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { cn } from "@/lib/utils";
import Link from "next/link";

const iconRegistry = icons as Record<string, LucideIcon>;

const resolveIcon = (iconName?: string): LucideIcon => {
    if (!iconName) return Tag;
    return iconRegistry[iconName] ?? Tag;
};

const renderNamedIcon = (iconName: string, className: string) => {
    const Icon = resolveIcon(iconName);
    return createElement(Icon, { className });
};

export default function CategoriesPage() {
    const { categories, transactions } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

    const monthNow = new Date().toISOString().slice(0, 7);

    const toUSD = (amount: number, curr: string) => {
        if (curr === "USD" || curr === "USDT") return amount;
        if (curr === "VES") return amount / rate;
        if (curr === "EUR") return amount * 1.08;
        return amount;
    };

    // Total acumulado y del mes actual, por category_id
    const { allTimeTotals, monthTotals } = useMemo(() => {
        const allTime = new Map<string, number>();
        const thisMonth = new Map<string, number>();
        for (const tx of transactions) {
            const usd = toUSD(tx.amount, tx.currency);
            allTime.set(tx.category_id, (allTime.get(tx.category_id) ?? 0) + usd);
            if (tx.date.startsWith(monthNow)) {
                thisMonth.set(tx.category_id, (thisMonth.get(tx.category_id) ?? 0) + usd);
            }
        }
        return { allTimeTotals: allTime, monthTotals: thisMonth };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, monthNow, rate]);

    const categoriesByType = useMemo(
        () =>
            sortCategoriesByPreset(
                categories.filter((c) => c.type === activeTab && !isLegacyDefaultCategory(c))
            ),
        [activeTab, categories]
    );

    const noCategory = useMemo(
        () =>
            categoriesByType.find(
                (c) => categoryIdentity(c.type, c.name) === categoryIdentity(activeTab, SIN_CATEGORIA)
            ),
        [activeTab, categoriesByType]
    );

    const categorizedItems = useMemo(
        () =>
            categoriesByType.filter(
                (c) => categoryIdentity(c.type, c.name) !== categoryIdentity(activeTab, SIN_CATEGORIA)
            ),
        [activeTab, categoriesByType]
    );

    const expenseSections = useMemo(
        () => groupExpenseCategories(categorizedItems.filter((c) => c.type === "expense")),
        [categorizedItems]
    );

    return (
        <div className="pb-safe pt-4 space-y-4">
            <header className="text-center">
                <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">Gestión</p>
                <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold">Categorías</h1>
            </header>

            {/* Tab toggle */}
            <div className="max-w-[14rem] mx-auto flex bg-black/5 p-0.5 rounded-full">
                {(["income", "expense"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all",
                            activeTab === tab
                                ? tab === "expense"
                                    ? "bg-white text-error shadow-sm"
                                    : "bg-white text-success shadow-sm"
                                : "text-muted-foreground hover:bg-black/5"
                        )}
                    >
                        {tab === "income" ? "Ingreso" : "Gasto"}
                    </button>
                ))}
            </div>

            {/* Sin categoría row */}
            {noCategory && (
                <Link href={`/categories/${noCategory.id}`}>
                    <CategoryRow
                        name={noCategory.name}
                        iconName={getCategoryVisual(noCategory).icon}
                        color={getCategoryVisual(noCategory).color}
                        allTimeTotal={allTimeTotals.get(noCategory.id) ?? 0}
                        monthTotal={monthTotals.get(noCategory.id) ?? 0}
                    />
                </Link>
            )}

            {/* Income list */}
            {activeTab === "income" && (
                <div className="space-y-2">
                    {categorizedItems.map((category) => {
                        const visual = getCategoryVisual(category);
                        return (
                            <Link key={category.id} href={`/categories/${category.id}`}>
                                <CategoryRow
                                    name={category.name}
                                    iconName={visual.icon}
                                    color={visual.color}
                                    allTimeTotal={allTimeTotals.get(category.id) ?? 0}
                                    monthTotal={monthTotals.get(category.id) ?? 0}
                                />
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Expense sections */}
            {activeTab === "expense" && (
                <div className="space-y-3">
                    {expenseSections.map((section) => (
                        <div key={section.id} className="space-y-1.5">
                            {/* Section header */}
                            <div className="paper-card p-3 rounded-xl flex items-center justify-between">
                                <div className="flex items-center min-w-0">
                                    <span
                                        className="w-9 h-9 rounded-xl flex items-center justify-center mr-2.5 shrink-0"
                                        style={{ backgroundColor: `${section.color}20`, color: section.color }}
                                    >
                                        {renderNamedIcon(section.icon, "w-4 h-4")}
                                    </span>
                                    <h2 className="font-mono text-sm font-bold truncate">{section.name}</h2>
                                </div>
                                <Link
                                    href={`/categories/new?type=expense&group=${section.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-7 h-7 rounded-full border border-black/25 flex items-center justify-center text-base leading-none text-foreground/70 hover:bg-black/5 transition-colors"
                                >
                                    +
                                </Link>
                            </div>

                            {/* Category rows */}
                            {section.categories.map((category) => {
                                const visual = getCategoryVisual(category);
                                return (
                                    <Link key={category.id} href={`/categories/${category.id}`}>
                                        <CategoryRow
                                            name={category.name}
                                            iconName={visual.icon}
                                            color={visual.color}
                                            compact
                                            allTimeTotal={allTimeTotals.get(category.id) ?? 0}
                                            monthTotal={monthTotals.get(category.id) ?? 0}
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {categorizedItems.length === 0 && (
                <div className="text-center py-10 font-mono text-muted-foreground text-xs uppercase opacity-50">
                    Sin categorías todavía
                </div>
            )}

            {/* New category button */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                <Link
                    href={`/categories/new?type=${activeTab}`}
                    className="w-full rounded-full bg-foreground text-background font-mono font-bold text-sm tracking-tight py-2.5 shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Categoría
                </Link>
            </div>
        </div>
    );
}

function CategoryRow({
    name,
    iconName,
    color,
    rightSlot,
    compact = false,
    allTimeTotal = 0,
    monthTotal = 0,
}: {
    name: string;
    iconName: string;
    color: string;
    rightSlot?: ReactNode;
    compact?: boolean;
    allTimeTotal?: number;
    monthTotal?: number;
}) {
    // Decide qué mostrar:
    // - Si hay total del mes → mostrar el del mes con etiqueta "mes"
    // - Si no hay del mes pero hay acumulado → mostrar acumulado con etiqueta "total"
    // - Si no hay nada → no mostrar badge
    const hasMoth = monthTotal > 0;
    const hasAll = allTimeTotal > 0;
    const displayAmount = hasMoth ? monthTotal : hasAll ? allTimeTotal : 0;
    const label = hasMoth ? "mes" : hasAll ? "total" : null;

    return (
        <div
            className={cn(
                "paper-card rounded-xl flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99]",
                compact ? "p-2.5 ml-4" : "p-3"
            )}
        >
            <div className="flex items-center min-w-0">
                <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-2.5 shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                >
                    {renderNamedIcon(iconName, "w-3.5 h-3.5")}
                </span>
                <p className="font-mono text-sm font-bold tracking-tight truncate">{name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
                {label && (
                    <div className="flex flex-col items-end">
                        <span className="font-mono text-xs font-bold text-foreground">
                            ${displayAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
                            {label}
                        </span>
                    </div>
                )}
                {rightSlot}
            </div>
        </div>
    );
}
