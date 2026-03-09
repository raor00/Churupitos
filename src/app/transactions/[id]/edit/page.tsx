"use client";

import { createElement, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Check,
    Search,
    Tag,
    Trash2,
    X,
    icons,
    type LucideIcon,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
    SIN_CATEGORIA,
    categoryIdentity,
    getCategoryVisual,
    groupExpenseCategories,
    isLegacyDefaultCategory,
    sortCategoriesByPreset,
} from "@/lib/categories/catalog";
import { cn } from "@/lib/utils";

const iconRegistry = icons as Record<string, LucideIcon>;
const resolveIcon = (name?: string): LucideIcon => (name ? (iconRegistry[name] ?? Tag) : Tag);

const CURRENCY_SYMBOL: Record<string, string> = {
    USD: "$",
    USDT: "$",
    VES: "Bs.",
    EUR: "€",
};

export default function EditTransactionPage() {
    const params = useParams();
    const router = useRouter();
    const txId = params.id as string;
    const { transactions, categories, updateTransaction, deleteTransaction } = useCurrentUser();

    const tx = transactions.find((t: any) => t.id === txId);

    // Form state — pre-fill from tx
    const [description, setDescription] = useState(tx?.description ?? "");
    const [amount, setAmount] = useState(tx ? String(tx.amount) : "0");
    const [currency, setCurrency] = useState<"USD" | "VES" | "EUR" | "USDT">(tx?.currency ?? "USD");
    const [categoryId, setCategoryId] = useState(tx?.category_id ?? "");
    const [date, setDate] = useState(tx?.date ?? new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState(tx?.notes ?? "");
    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const txType = tx?.type ?? "expense";

    // Category lists
    const categoriesByType = useMemo(
        () => sortCategoriesByPreset(categories.filter((cat: any) => cat.type === txType && !isLegacyDefaultCategory(cat))),
        [categories, txType]
    );

    const visibleCategories = useMemo(() => {
        const q = categorySearch.trim().toLowerCase();
        if (!q) return categoriesByType;
        return categoriesByType.filter((cat: any) => cat.name.toLowerCase().includes(q));
    }, [categoriesByType, categorySearch]);

    const expenseSections = useMemo(
        () => groupExpenseCategories(visibleCategories.filter((cat: any) =>
            categoryIdentity(cat.type, cat.name) !== categoryIdentity("expense", SIN_CATEGORIA)
        )),
        [visibleCategories]
    );

    const selectedCategory = categories.find((c: any) => c.id === categoryId);
    const categoryVisual = selectedCategory
        ? getCategoryVisual(selectedCategory)
        : { icon: "CircleOff", color: "#6D7588", name: SIN_CATEGORIA };

    if (!tx) {
        return (
            <div className="pt-4 flex flex-col items-center gap-3 py-20">
                <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest">
                    Transacción no encontrada
                </p>
                <Link href="/transactions" className="text-[10px] font-mono text-primary uppercase tracking-widest">
                    Volver
                </Link>
            </div>
        );
    }

    const handleSave = async () => {
        const num = parseFloat(amount);
        if (!description.trim() || isNaN(num) || num <= 0) return;
        setIsSubmitting(true);
        try {
            await updateTransaction(txId, {
                description: description.trim(),
                amount: num,
                currency,
                category_id: categoryId,
                date,
                notes: notes.trim() || undefined,
            });
            router.push("/transactions");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await deleteTransaction(txId);
            router.push("/transactions");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isIncome = txType === "income";
    const accentColor = isIncome ? "text-success" : "text-error";

    return (
        <div className="pt-4 pb-safe space-y-4">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/transactions"
                        className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                            {isIncome ? "Ingreso" : "Gasto"}
                        </p>
                        <h1 className="text-xl font-mono tracking-tighter font-bold uppercase">Editar</h1>
                    </div>
                </div>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center text-error hover:bg-error/20 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </header>

            {/* Amount input */}
            <div className="paper-card rounded-2xl p-4">
                <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-2">Monto</p>
                <div className="flex items-center gap-3">
                    <span className={cn("font-mono text-2xl font-bold", accentColor)}>
                        {CURRENCY_SYMBOL[currency]}
                    </span>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="flex-1 font-mono text-3xl font-bold tracking-tighter bg-transparent outline-none border-b border-black/10 pb-1"
                        placeholder="0.00"
                    />
                </div>
                {/* Currency pills */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                    {(["USD", "VES", "EUR", "USDT"] as const).map(c => (
                        <button
                            key={c}
                            onClick={() => setCurrency(c)}
                            className={cn(
                                "px-2.5 py-1 rounded-full font-mono text-[10px] font-bold transition-all",
                                currency === c
                                    ? "bg-foreground text-background"
                                    : "bg-black/5 text-muted-foreground hover:bg-black/10"
                            )}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="paper-card rounded-2xl p-4 space-y-3">
                <div>
                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1.5">Concepto</p>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Descripción"
                        className="w-full font-mono text-sm font-bold bg-transparent outline-none border-b border-black/10 pb-1.5"
                    />
                </div>
                <div>
                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1.5">Fecha</p>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                        className="w-full font-mono text-sm bg-transparent outline-none border-b border-black/10 pb-1.5"
                    />
                </div>
                <div>
                    <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-1.5">Notas <span className="opacity-40">(opcional)</span></p>
                    <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Notas adicionales"
                        className="w-full font-mono text-sm bg-transparent outline-none border-b border-black/10 pb-1.5"
                    />
                </div>
            </div>

            {/* Category */}
            <div className="paper-card rounded-2xl p-4">
                <p className="font-mono text-[9px] uppercase text-muted-foreground tracking-widest mb-2">Categoría</p>
                <button
                    onClick={() => setIsCategorySheetOpen(true)}
                    className="w-full flex items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-2.5">
                        <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${categoryVisual.color}20`, color: categoryVisual.color }}
                        >
                            {createElement(resolveIcon(categoryVisual.icon), { className: "w-4 h-4" })}
                        </span>
                        <span className="font-mono font-bold text-sm">{categoryVisual.name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs font-mono">Cambiar →</span>
                </button>
            </div>

            {/* Save button */}
            <button
                onClick={handleSave}
                disabled={isSubmitting || !description.trim() || parseFloat(amount) <= 0}
                className={cn(
                    "w-full py-3.5 rounded-2xl font-mono font-bold text-sm uppercase tracking-widest transition-all",
                    isIncome
                        ? "bg-success text-white disabled:opacity-40"
                        : "bg-foreground text-background disabled:opacity-40"
                )}
            >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>

            {/* ── Category Sheet ──────────────────────────────────────────── */}
            <AnimatePresence>
                {isCategorySheetOpen && (
                    <>
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCategorySheetOpen(false)}
                            className="fixed inset-0 bg-black/30 z-40"
                        />
                        <motion.div
                            key="sheet"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80dvh] flex flex-col"
                        >
                            <div className="p-4 border-b border-black/5 flex-shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-mono font-bold text-sm uppercase tracking-widest">Categoría</h2>
                                    <button
                                        onClick={() => setIsCategorySheetOpen(false)}
                                        className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={categorySearch}
                                        onChange={e => setCategorySearch(e.target.value)}
                                        placeholder="Buscar categoría..."
                                        className="w-full pl-8 pr-3 py-2 bg-black/5 rounded-xl font-mono text-xs outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                                {/* Sin categoría option */}
                                {visibleCategories.filter(c => categoryIdentity(c.type, c.name) === categoryIdentity(txType, SIN_CATEGORIA)).map(cat => {
                                    const v = getCategoryVisual(cat);
                                    const isSelected = categoryId === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => { setCategoryId(cat.id); setIsCategorySheetOpen(false); }}
                                            className={cn(
                                                "w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all",
                                                isSelected ? "bg-black/5" : "hover:bg-black/5"
                                            )}
                                        >
                                            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${v.color}20`, color: v.color }}>
                                                {createElement(resolveIcon(v.icon), { className: "w-3.5 h-3.5" })}
                                            </span>
                                            <span className="font-mono text-xs font-bold flex-1 text-left">{v.name}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-success" />}
                                        </button>
                                    );
                                })}

                                {/* Expense grouped sections */}
                                {txType === "expense"
                                    ? expenseSections.map(section => (
                                        <div key={section.id}>
                                            <div className="flex items-center gap-1.5 mb-1.5 px-1">
                                                <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                                    style={{ color: section.color }}>
                                                    {createElement(resolveIcon(section.icon), { className: "w-3 h-3" })}
                                                </span>
                                                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                                                    {section.name}
                                                </p>
                                            </div>
                                            {section.categories.map((cat: any) => {
                                                const v = getCategoryVisual(cat);
                                                const isSelected = categoryId === cat.id;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => { setCategoryId(cat.id); setIsCategorySheetOpen(false); }}
                                                        className={cn(
                                                            "w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all",
                                                            isSelected ? "bg-black/5" : "hover:bg-black/5"
                                                        )}
                                                    >
                                                        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                            style={{ backgroundColor: `${v.color}20`, color: v.color }}>
                                                            {createElement(resolveIcon(v.icon), { className: "w-3.5 h-3.5" })}
                                                        </span>
                                                        <span className="font-mono text-xs font-bold flex-1 text-left">{v.name}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-success" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))
                                    : visibleCategories
                                        .filter(c => categoryIdentity(c.type, c.name) !== categoryIdentity("income", SIN_CATEGORIA))
                                        .map((cat: any) => {
                                            const v = getCategoryVisual(cat);
                                            const isSelected = categoryId === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => { setCategoryId(cat.id); setIsCategorySheetOpen(false); }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all",
                                                        isSelected ? "bg-black/5" : "hover:bg-black/5"
                                                    )}
                                                >
                                                    <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: `${v.color}20`, color: v.color }}>
                                                        {createElement(resolveIcon(v.icon), { className: "w-3.5 h-3.5" })}
                                                    </span>
                                                    <span className="font-mono text-xs font-bold flex-1 text-left">{v.name}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-success" />}
                                                </button>
                                            );
                                        })
                                }
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete confirm dialog ───────────────────────────────────── */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <>
                        <motion.div
                            key="del-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(false)}
                            className="fixed inset-0 bg-black/40 z-50"
                        />
                        <motion.div
                            key="del-dialog"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-5 shadow-2xl"
                        >
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
                                <Trash2 className="w-5 h-5 text-error" />
                            </div>
                            <h3 className="font-mono font-bold text-center text-sm uppercase tracking-tight mb-1">
                                ¿Eliminar transacción?
                            </h3>
                            <p className="font-mono text-[10px] text-muted-foreground text-center mb-4">
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-black/10 font-mono text-xs font-bold uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2.5 rounded-xl bg-error text-white font-mono text-xs font-bold uppercase tracking-widest disabled:opacity-40"
                                >
                                    {isSubmitting ? "..." : "Eliminar"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
