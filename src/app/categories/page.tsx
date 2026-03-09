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
    const { categories } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

    const categoriesByType = useMemo(
        () =>
            sortCategoriesByPreset(
                categories.filter((category) => category.type === activeTab && !isLegacyDefaultCategory(category))
            ),
        [activeTab, categories]
    );

    const noCategory = useMemo(
        () =>
            categoriesByType.find(
                (category) => categoryIdentity(category.type, category.name) === categoryIdentity(activeTab, SIN_CATEGORIA)
            ),
        [activeTab, categoriesByType]
    );

    const categorizedItems = useMemo(
        () =>
            categoriesByType.filter(
                (category) =>
                    categoryIdentity(category.type, category.name) !== categoryIdentity(activeTab, SIN_CATEGORIA)
            ),
        [activeTab, categoriesByType]
    );

    const expenseSections = useMemo(
        () => groupExpenseCategories(categorizedItems.filter((category) => category.type === "expense")),
        [categorizedItems]
    );

    return (
        <div className="pb-36 pt-4 space-y-5">
            <header className="text-center">
                <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold">Categorías</h1>
            </header>

            <div className="max-w-[16rem] mx-auto flex bg-black/5 p-1 rounded-full">
                {(["income", "expense"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-2 rounded-full font-mono text-xs font-bold uppercase transition-all",
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

            {noCategory && (
                <CategoryRow
                    key={noCategory.id}
                    name={noCategory.name}
                    iconName={getCategoryVisual(noCategory).icon}
                    color={getCategoryVisual(noCategory).color}
                />
            )}

            {activeTab === "income" && (
                <div className="space-y-3">
                    {categorizedItems.map((category) => {
                        const visual = getCategoryVisual(category);
                        return (
                            <CategoryRow
                                key={category.id}
                                name={category.name}
                                iconName={visual.icon}
                                color={visual.color}
                                rightSlot={
                                    <span className="w-8 h-8 rounded-full border border-black/35 flex items-center justify-center text-xl leading-none text-foreground/80">
                                        +
                                    </span>
                                }
                            />
                        );
                    })}
                </div>
            )}

            {activeTab === "expense" && (
                <div className="space-y-4">
                    {expenseSections.map((section) => {
                        return (
                            <div key={section.id} className="space-y-2">
                                <div className="paper-card p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center min-w-0">
                                        <span
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center mr-3 shrink-0"
                                            style={{
                                                backgroundColor: `${section.color}20`,
                                                color: section.color,
                                            }}
                                        >
                                            {renderNamedIcon(section.icon, "w-6 h-6")}
                                        </span>
                                        <h2 className="font-mono text-lg font-bold truncate">{section.name}</h2>
                                    </div>
                                    <Link
                                        href={`/categories/new?type=expense&group=${section.id}`}
                                        className="w-8 h-8 rounded-full border border-black/35 flex items-center justify-center text-xl leading-none text-foreground/80"
                                    >
                                        +
                                    </Link>
                                </div>

                                {section.categories.map((category) => {
                                    const visual = getCategoryVisual(category);
                                    return (
                                        <CategoryRow
                                            key={category.id}
                                            name={category.name}
                                            iconName={visual.icon}
                                            color={visual.color}
                                            compact
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}

            {categorizedItems.length === 0 && (
                <div className="text-center py-10 font-mono text-muted-foreground text-xs uppercase opacity-50">
                    Sin categorías todavía
                </div>
            )}

            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                <Link
                    href={`/categories/new?type=${activeTab}`}
                    className="w-full rounded-full bg-primary text-primary-foreground font-mono font-bold text-xl tracking-tight py-4 shadow-xl flex items-center justify-center gap-3"
                >
                    <Plus className="w-6 h-6" />
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
}: {
    name: string;
    iconName: string;
    color: string;
    rightSlot?: ReactNode;
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                "paper-card rounded-2xl flex items-center justify-between",
                compact ? "p-3.5 ml-6" : "p-4"
            )}
        >
            <div className="flex items-center min-w-0">
                <span
                    className={cn(
                        "rounded-xl flex items-center justify-center mr-3 shrink-0",
                        compact ? "w-10 h-10" : "w-12 h-12"
                    )}
                    style={{ backgroundColor: `${color}20`, color }}
                >
                    {renderNamedIcon(iconName, compact ? "w-4 h-4" : "w-5 h-5")}
                </span>
                <p className={cn("font-mono tracking-tight truncate", compact ? "text-xl" : "text-3xl")}>{name}</p>
            </div>
            {rightSlot}
        </div>
    );
}
