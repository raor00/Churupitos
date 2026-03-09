"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTransactionSound } from "@/hooks/useTransactionSound";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronRight,
    CirclePlus,
    Delete,
    Search,
    Tag,
    X,
    icons,
    type LucideIcon,
} from "lucide-react";
import {
    SIN_CATEGORIA,
    categoryIdentity,
    getCategoryVisual,
    groupExpenseCategories,
    isLegacyDefaultCategory,
    sortCategoriesByPreset,
} from "@/lib/categories/catalog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const CURRENCY_SYMBOL: Record<"USD" | "VES" | "EUR" | "USDT", string> = {
    USD: "$",
    USDT: "$",
    VES: "Bs.",
    EUR: "€",
};

const txSchema = z.object({
    amount: z.number().positive("El monto debe ser positivo"),
    transaction_currency: z.enum(["USD", "VES", "EUR", "USDT"]),
    account_id: z.string().min(1, "Selecciona una cuenta de pago"),
    description: z.string().min(2, "El concepto es muy corto"),
    category_id: z.string().min(1, "Selecciona una categoría"),
    notes: z.string().optional(),
});

type TxFormValues = z.infer<typeof txSchema>;

const iconRegistry = icons as Record<string, LucideIcon>;

const resolveIcon = (iconName?: string): LucideIcon => {
    if (!iconName) return Tag;
    return iconRegistry[iconName] ?? Tag;
};

const toUSD = (amount: number, currency: TxFormValues["transaction_currency"], rate: number) => {
    if (currency === "USD" || currency === "USDT") return amount;
    if (currency === "VES") return amount / rate;
    if (currency === "EUR") return amount * 1.08;
    return amount;
};

export default function NewTransactionWizard() {
    const router = useRouter();
    const { categories, addTransaction, accounts } = useCurrentUser();
    const { playExpenseSound, playIncomeSound } = useTransactionSound();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);

    const [step, setStep] = useState<1 | 2>(1);
    const [txType, setTxType] = useState<"expense" | "income">("expense");
    const [amountStr, setAmountStr] = useState("0");
    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<TxFormValues>({
        resolver: zodResolver(txSchema),
        defaultValues: {
            transaction_currency: "USD",
            account_id: "",
            category_id: "",
            amount: 0,
            description: "",
            notes: "",
        },
    });

    const txCurrency = watch("transaction_currency");
    const selectedAccountId = watch("account_id");
    const selectedCategoryId = watch("category_id");
    const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

    const categoriesByType = useMemo(
        () =>
            sortCategoriesByPreset(
                categories.filter((cat) => cat.type === txType && !isLegacyDefaultCategory(cat))
            ),
        [categories, txType]
    );

    const noCategoryOption = useMemo(
        () => categoriesByType.find((cat) => categoryIdentity(cat.type, cat.name) === categoryIdentity(txType, SIN_CATEGORIA)),
        [categoriesByType, txType]
    );

    const visibleCategories = useMemo(() => {
        const query = categorySearch.trim().toLowerCase();
        if (!query) return categoriesByType;
        return categoriesByType.filter((cat) => cat.name.toLowerCase().includes(query));
    }, [categoriesByType, categorySearch]);

    const expenseSections = useMemo(
        () =>
            groupExpenseCategories(
                visibleCategories.filter(
                    (cat) => categoryIdentity(cat.type, cat.name) !== categoryIdentity("expense", SIN_CATEGORIA)
                )
            ),
        [visibleCategories]
    );

    useEffect(() => {
        if (!selectedAccountId && accounts.length > 0) {
            setValue("account_id", accounts[0].id, { shouldValidate: true });
        }
    }, [accounts, selectedAccountId, setValue]);

    useEffect(() => {
        if (categoriesByType.length === 0) {
            setValue("category_id", "", { shouldValidate: true });
            return;
        }

        const current = categories.find((cat) => cat.id === selectedCategoryId);
        if (current?.type === txType) return;

        const fallback = noCategoryOption ?? categoriesByType[0];
        setValue("category_id", fallback?.id ?? "", { shouldValidate: true });
    }, [categories, categoriesByType, noCategoryOption, selectedCategoryId, setValue, txType]);

    const handleNumpad = (val: string) => {
        if (val === "delete") {
            setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
            return;
        }

        if (val === ".") {
            if (!amountStr.includes(".")) setAmountStr((prev) => `${prev}.`);
            return;
        }

        setAmountStr((prev) => (prev === "0" ? val : `${prev}${val}`));
    };

    const handleNextStep = () => {
        const num = Number.parseFloat(amountStr);
        if (num > 0) {
            setValue("amount", num, { shouldValidate: true });
            setStep(2);
        }
    };

    const onSubmit = async (data: TxFormValues) => {
        if (!selectedAccount) return;

        const amountUSD = toUSD(data.amount, data.transaction_currency, rate);
        const amountInVES = amountUSD * rate;
        const rateType = ratesState.preferredRate === "bcv" ? "bcv" : "usdt";

        await addTransaction({
            type: txType,
            description: data.description,
            amount: data.amount,
            currency: data.transaction_currency,
            account_id: data.account_id,
            amount_ves: amountInVES,
            rate_used: rate,
            rate_type: rateType,
            category_id: data.category_id,
            date: new Date().toISOString().split("T")[0],
            notes: data.notes || undefined,
        } as Parameters<typeof addTransaction>[0]);

        if (txType === "expense") playExpenseSound();
        else playIncomeSound();

        router.push("/transactions");
    };

    const CategoryIcon = resolveIcon(getCategoryVisual(selectedCategory ?? { type: txType, name: SIN_CATEGORIA, icon: "CircleOff", color: "#6D7588" }).icon);
    const categoryVisual = selectedCategory
        ? getCategoryVisual(selectedCategory)
        : getCategoryVisual({ type: txType, name: SIN_CATEGORIA, icon: "CircleOff", color: "#6D7588" });

    return (
        <div className="pt-1 h-[calc(100dvh-9rem)] flex flex-col overflow-hidden">
            <header className="flex items-center space-x-3 mb-3">
                {step === 1 ? (
                    <Link
                        href="/"
                        className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/60 backdrop-blur-sm transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </Link>
                ) : (
                    <button
                        onClick={() => setStep(1)}
                        className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/60 backdrop-blur-sm transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">
                    Nuevo Movimiento
                </h1>
            </header>

            <div className="flex bg-black/5 p-1 rounded-xl mb-3 shadow-inner">
                {(["expense", "income"] as const).map((typeItem) => (
                    <button
                        key={typeItem}
                        onClick={() => setTxType(typeItem)}
                        className={`flex-1 text-center py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all ${
                            txType === typeItem
                                ? typeItem === "expense"
                                    ? "bg-white text-error shadow-sm"
                                    : "bg-white text-success shadow-sm"
                                : "text-muted-foreground hover:bg-black/5"
                        }`}
                    >
                        {typeItem === "expense" ? "Gasto" : "Ingreso"}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="flex-1 min-h-0 flex flex-col"
                    >
                        <div className="text-center space-y-3 mb-3">
                            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                                ¿Cuánto dinero?
                            </p>

                            <div className="text-5xl leading-none font-mono tracking-tighter font-bold flex items-center justify-center w-full px-2">
                                <span className="text-muted-foreground mr-1.5 opacity-60 text-2xl">
                                    {CURRENCY_SYMBOL[txCurrency]}
                                </span>
                                {amountStr}
                            </div>

                            <div className="inline-flex gap-1 overflow-x-auto p-1 bg-black/5 rounded-full border border-black/5 max-w-full mx-auto">
                                {(["USD", "VES", "EUR", "USDT"] as const).map((curr) => (
                                    <button
                                        key={curr}
                                        onClick={() => setValue("transaction_currency", curr)}
                                        className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all ${
                                            txCurrency === curr
                                                ? "bg-foreground text-background shadow-md"
                                                : "text-muted-foreground hover:bg-black/5"
                                        }`}
                                    >
                                        {curr}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "delete"].map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handleNumpad(String(key))}
                                    className="h-12 sm:h-14 rounded-2xl bg-white/60 backdrop-blur-sm border border-black/10 font-mono text-xl font-bold flex items-center justify-center hover:bg-black/5 active:bg-black/10 active:scale-95 transition-all shadow-sm"
                                >
                                    {key === "delete" ? <Delete className="w-5 h-5 text-muted-foreground" /> : key}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleNextStep}
                            disabled={Number.parseFloat(amountStr) <= 0}
                            className="w-full max-w-sm mx-auto mt-3 py-3.5 rounded-2xl bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest shadow-xl shadow-primary/20 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
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
                        className="flex-1 min-h-0"
                    >
                        <div className="paper-card p-4 rounded-2xl h-full">
                            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                                    <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                        Monto
                                    </span>
                                    <span className="font-mono text-2xl font-bold tracking-tighter">
                                        {CURRENCY_SYMBOL[txCurrency]} {amountStr}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase text-muted-foreground font-bold tracking-widest">
                                        Cuenta
                                    </label>
                                    {accounts.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {accounts.map((acc) => (
                                                <label
                                                    key={acc.id}
                                                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-16 ${
                                                        selectedAccountId === acc.id
                                                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                                                            : "border-black/10 bg-white/50 hover:bg-black/5"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        value={acc.id}
                                                        {...register("account_id")}
                                                        className="hidden"
                                                    />
                                                    <span className="font-mono text-[11px] font-bold line-clamp-1">{acc.name}</span>
                                                    <span className="font-mono text-[9px] text-muted-foreground uppercase">
                                                        {acc.currency}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-black/15 p-3 bg-white/40">
                                            <p className="font-mono text-[11px] text-muted-foreground mb-2">
                                                No tienes cuentas. Crea una para registrar movimientos.
                                            </p>
                                            <Link
                                                href="/accounts/new"
                                                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-foreground"
                                            >
                                                <CirclePlus className="w-3.5 h-3.5" />
                                                Nueva cuenta
                                            </Link>
                                        </div>
                                    )}
                                    {errors.account_id && (
                                        <p className="text-error text-[10px] font-mono mt-1">{errors.account_id.message}</p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        {...register("description")}
                                        className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-lg p-1.5 transition-colors outline-none placeholder:text-black/30"
                                        placeholder="Concepto (Ej. Sushi)"
                                    />
                                    {errors.description && (
                                        <p className="text-error text-[10px] font-mono mt-1">{errors.description.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono uppercase text-muted-foreground font-bold tracking-widest">
                                        Categoría
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCategorySheetOpen(true)}
                                        className="w-full p-2.5 rounded-xl border border-black/10 bg-white/60 hover:bg-black/5 transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex items-center min-w-0">
                                            <span
                                                className="w-8 h-8 rounded-lg mr-2 flex items-center justify-center"
                                                style={{ backgroundColor: `${categoryVisual.color}20`, color: categoryVisual.color }}
                                            >
                                                <CategoryIcon className="w-4 h-4" />
                                            </span>
                                            <div className="text-left min-w-0">
                                                <p className="font-mono text-sm font-bold truncate">
                                                    {selectedCategory?.name ?? SIN_CATEGORIA}
                                                </p>
                                                <p className="font-mono text-[9px] text-muted-foreground uppercase">
                                                    {selectedCategory?.type === "income" ? "Ingreso" : "Gasto"}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    </button>
                                    {errors.category_id && (
                                        <p className="text-error text-[10px] font-mono mt-1">{errors.category_id.message}</p>
                                    )}
                                </div>

                                <input
                                    {...register("notes")}
                                    className="w-full bg-transparent border-b border-black/15 focus:border-primary font-mono text-sm p-1.5 transition-colors outline-none placeholder:text-black/30"
                                    placeholder="Nota (opcional)"
                                />

                                <button
                                    type="submit"
                                    disabled={accounts.length === 0}
                                    className="mt-auto w-full bg-foreground text-background font-mono font-bold uppercase tracking-widest py-3.5 rounded-xl shadow-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCategorySheetOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-end"
                        onClick={() => setIsCategorySheetOpen(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            onClick={(event) => event.stopPropagation()}
                            className="w-full max-w-md mx-auto rounded-t-3xl bg-background border border-black/10 shadow-2xl p-4 h-[78dvh] flex flex-col"
                        >
                            <div className="w-10 h-1 bg-black/20 rounded-full mx-auto mb-3" />
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-mono text-lg font-bold tracking-tight">Seleccionar categoría</h2>
                                <Link
                                    href={`/categories/new?type=${txType}`}
                                    className="px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 font-mono text-[10px] uppercase tracking-widest"
                                >
                                    Nueva categoría
                                </Link>
                            </div>

                            <div className="relative mb-3">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={categorySearch}
                                    onChange={(event) => setCategorySearch(event.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/5 border border-black/10 font-mono text-sm outline-none focus:border-primary"
                                    placeholder="Buscar categoría..."
                                />
                            </div>

                            <div className="overflow-y-auto pr-1 space-y-3 pb-8">
                                {noCategoryOption && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setValue("category_id", noCategoryOption.id, { shouldValidate: true });
                                            setIsCategorySheetOpen(false);
                                        }}
                                        className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between ${
                                            selectedCategoryId === noCategoryOption.id
                                                ? "border-primary bg-primary/10"
                                                : "border-black/10 bg-white/60"
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <span className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center mr-3">
                                                <Tag className="w-4 h-4 text-muted-foreground" />
                                            </span>
                                            <span className="font-mono font-bold">Sin categoría</span>
                                        </div>
                                        {selectedCategoryId === noCategoryOption.id ? (
                                            <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                                                <Check className="w-4 h-4" />
                                            </span>
                                        ) : (
                                            <span className="w-7 h-7 rounded-lg border border-black/20" />
                                        )}
                                    </button>
                                )}

                                {txType === "income" &&
                                    visibleCategories
                                        .filter(
                                            (cat) =>
                                                categoryIdentity(cat.type, cat.name) !==
                                                categoryIdentity("income", SIN_CATEGORIA)
                                        )
                                        .map((cat) => {
                                            const visual = getCategoryVisual(cat);
                                            const Icon = resolveIcon(visual.icon);
                                            const active = selectedCategoryId === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setValue("category_id", cat.id, { shouldValidate: true });
                                                        setIsCategorySheetOpen(false);
                                                    }}
                                                    className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between ${
                                                        active ? "border-primary bg-primary/10" : "border-black/10 bg-white/60"
                                                    }`}
                                                >
                                                    <div className="flex items-center">
                                                        <span
                                                            className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center"
                                                            style={{
                                                                backgroundColor: `${visual.color}20`,
                                                                color: visual.color,
                                                            }}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </span>
                                                        <span className="font-mono text-base">{cat.name}</span>
                                                    </div>
                                                    {active ? (
                                                        <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                                                            <Check className="w-4 h-4" />
                                                        </span>
                                                    ) : (
                                                        <span className="w-7 h-7 rounded-lg border border-black/20" />
                                                    )}
                                                </button>
                                            );
                                        })}

                                {txType === "expense" &&
                                    expenseSections.map((section) => {
                                        const SectionIcon = resolveIcon(section.icon);
                                        return (
                                            <div key={section.id} className="space-y-2">
                                                <div className="flex items-center px-1">
                                                    <span
                                                        className="w-8 h-8 rounded-lg mr-2 flex items-center justify-center"
                                                        style={{
                                                            backgroundColor: `${section.color}22`,
                                                            color: section.color,
                                                        }}
                                                    >
                                                        <SectionIcon className="w-4 h-4" />
                                                    </span>
                                                    <p className="font-mono text-xs uppercase tracking-widest font-bold text-muted-foreground">
                                                        {section.name}
                                                    </p>
                                                </div>
                                                {section.categories.map((cat) => {
                                                    const visual = getCategoryVisual(cat);
                                                    const Icon = resolveIcon(visual.icon);
                                                    const active = selectedCategoryId === cat.id;
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setValue("category_id", cat.id, { shouldValidate: true });
                                                                setIsCategorySheetOpen(false);
                                                            }}
                                                            className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between ${
                                                                active
                                                                    ? "border-primary bg-primary/10"
                                                                    : "border-black/10 bg-white/60"
                                                            }`}
                                                        >
                                                            <div className="flex items-center">
                                                                <span
                                                                    className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center"
                                                                    style={{
                                                                        backgroundColor: `${visual.color}20`,
                                                                        color: visual.color,
                                                                    }}
                                                                >
                                                                    <Icon className="w-4 h-4" />
                                                                </span>
                                                                <span className="font-mono text-base">{cat.name}</span>
                                                            </div>
                                                            {active ? (
                                                                <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                                                                    <Check className="w-4 h-4" />
                                                                </span>
                                                            ) : (
                                                                <span className="w-7 h-7 rounded-lg border border-black/20" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}

                                {visibleCategories.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="font-mono text-xs text-muted-foreground uppercase opacity-60">
                                            Sin resultados
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
