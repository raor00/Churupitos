"use client";

import { useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    FileText,
    Search,
    Trash2,
    Upload,
} from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { categoryIdentity } from "@/lib/categories/catalog";

type PreviewRow = {
    description: string;
    amount: number;
    currency: "USD";
    type: "income";
    date: string;
    category_id: string;
    category_name: string;
    month_label?: string;
    valid: boolean;
    adjustedByFallback: boolean;
    error?: string;
};

type ParsedIncomeCsv = {
    mode: "rafa-income";
    rows: PreviewRow[];
};

const normalizeText = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

function parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
            continue;
        }
        current += char;
    }

    result.push(current);
    return result;
}

function parseDate(raw: string): string | null {
    if (!raw.trim()) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
}

function parseMoney(raw: string): number {
    const normalized = raw.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
    const amount = Number.parseFloat(normalized);
    return Number.isFinite(amount) ? amount : NaN;
}

function detectRafaIncomeCsv(headers: string[]) {
    const normalizedHeaders = headers.map((header) => normalizeText(header.replace(/^\uFEFF/, "")));
    return (
        normalizedHeaders.includes("income") &&
        normalizedHeaders.includes("amount") &&
        normalizedHeaders.includes("date") &&
        normalizedHeaders.includes("type")
    );
}

function resolveIncomeCategory(rawType: string, categories: Array<{ id: string; name: string; type: "income" | "expense" }>) {
    const normalized = normalizeText(rawType);
    const targetName =
        normalized === "salary"
            ? "Salario"
            : normalized === "other" || !normalized
                ? "Otros ingresos"
                : "Otros ingresos";
    const category = categories.find(
        (item) => item.type === "income" && categoryIdentity("income", item.name) === categoryIdentity("income", targetName)
    );

    return {
        category_id: category?.id ?? "",
        category_name: category?.name ?? targetName,
        adjustedByFallback: normalized !== "salary" && normalized !== "other",
    };
}

function parseRafaIncomeCsv(
    csv: string,
    categories: Array<{ id: string; name: string; type: "income" | "expense" }>
): ParsedIncomeCsv | null {
    const lines = csv.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return null;

    const headers = parseCSVRow(lines[0]);
    if (!detectRafaIncomeCsv(headers)) return null;

    const normalizedHeaders = headers.map((header) => normalizeText(header.replace(/^\uFEFF/, "")));
    const columnIndex = {
        income: normalizedHeaders.findIndex((header) => header === "income"),
        amount: normalizedHeaders.findIndex((header) => header === "amount"),
        date: normalizedHeaders.findIndex((header) => header === "date"),
        monthClassification: normalizedHeaders.findIndex((header) => header === "month classification"),
        type: normalizedHeaders.findIndex((header) => header === "type"),
    };

    const rows = lines.slice(1).map((line) => {
        const cells = parseCSVRow(line);
        const description = (cells[columnIndex.income] ?? "").trim();
        const amount = parseMoney(cells[columnIndex.amount] ?? "");
        const date = parseDate(cells[columnIndex.date] ?? "");
        const monthLabel = (cells[columnIndex.monthClassification] ?? "").trim();
        const rawType = (cells[columnIndex.type] ?? "").trim();
        const category = resolveIncomeCategory(rawType, categories);

        const valid = Boolean(description) && Number.isFinite(amount) && amount > 0 && Boolean(date);
        return {
            description,
            amount: Number.isFinite(amount) ? amount : 0,
            currency: "USD" as const,
            type: "income" as const,
            date: date ?? "",
            category_id: category.category_id,
            category_name: category.category_name,
            month_label: monthLabel || undefined,
            valid: valid && Boolean(category.category_id),
            adjustedByFallback: category.adjustedByFallback,
            error: valid
                ? (category.category_id ? undefined : "Categoria de ingreso no disponible")
                : "Fila vacia o invalida",
        };
    });

    return { mode: "rafa-income", rows };
}

export default function ImportPage() {
    const { user, accounts, categories, transactions, addTransaction } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const fileRef = useRef<HTMLInputElement>(null);

    const [rows, setRows] = useState<PreviewRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [importing, setImporting] = useState(false);
    const [done, setDone] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<ParsedIncomeCsv["mode"] | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    const isRafa = user?.username === "rafa";
    const effectiveAccountId = selectedAccountId || accounts[0]?.id || "";
    const isDuplicate = (row: PreviewRow) =>
        transactions.some((tx) => {
            if (tx.account_id !== effectiveAccountId) return false;
            return (
                tx.type === "income" &&
                tx.date === row.date &&
                Number(tx.amount.toFixed(2)) === Number(row.amount.toFixed(2)) &&
                normalizeText(tx.description) === normalizeText(row.description)
            );
        });

    const filteredRows = useMemo(
        () =>
            rows
                .map((row, index) => ({ row, index }))
                .filter(({ row }) => normalizeText(row.description).includes(normalizeText(search))),
        [rows, search]
    );

    const validCount = rows.filter((row, index) => row.valid && !isDuplicate(row) && selectedRows.has(index)).length;

    const resetState = () => {
        setRows([]);
        setFileName(null);
        setSelectedRows(new Set());
        setDone(false);
        setMode(null);
        setFileError(null);
        setSearch("");
    };

    const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setDone(false);
        setFileError(null);

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const text = String(loadEvent.target?.result ?? "");
            const parsed = parseRafaIncomeCsv(text, categories);
            if (!parsed) {
                setRows([]);
                setMode(null);
                setFileError("Este archivo no coincide con el CSV de ingresos de Rafa.");
                return;
            }

            setMode(parsed.mode);
            setRows(parsed.rows);
            setSelectedRows(
                new Set(
                    parsed.rows
                        .map((row, index) => ({ row, index }))
                        .filter(({ row }) => row.valid)
                        .map(({ index }) => index)
                )
            );
        };
        reader.readAsText(file, "utf-8");
    };

    const toggleRow = (rowIndex: number) => {
        setSelectedRows((previous) => {
            const next = new Set(previous);
            if (next.has(rowIndex)) next.delete(rowIndex);
            else next.add(rowIndex);
            return next;
        });
    };

    const handleImport = async () => {
        if (!effectiveAccountId) return;
        setImporting(true);
        setFileError(null);

        const selectedRowsSorted = rows
            .map((row, index) => ({ row, index }))
            .filter(({ row, index }) => row.valid && !isDuplicate(row) && selectedRows.has(index))
            .sort((left, right) => left.row.date.localeCompare(right.row.date));

        try {
            for (const { row } of selectedRowsSorted) {
                await addTransaction({
                    type: "income",
                    description: row.description,
                    amount: row.amount,
                    currency: "USD",
                    amount_ves: row.amount * rate,
                    rate_used: rate,
                    rate_type: ratesState.preferredRate === "bcv" ? "bcv" : "usdt",
                    category_id: row.category_id,
                    account_id: effectiveAccountId,
                    date: row.date,
                });
            }

            setDone(true);
        } catch (error) {
            setFileError(error instanceof Error ? error.message : "No se pudieron importar los movimientos.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="pb-safe pt-4 space-y-6">
            <header className="flex items-center space-x-4">
                <Link href="/" className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">Importar CSV</h1>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        Ingresos de Rafa con cuenta destino
                    </p>
                </div>
            </header>

            {!isRafa && (
                <div className="paper-card rounded-2xl p-4 border border-warning/20 bg-warning/5">
                    <p className="font-mono text-xs uppercase tracking-widest text-warning">Modo de prueba</p>
                    <p className="font-mono text-sm mt-2">
                        Este importador esta configurado para probar primero en el perfil de Rafa.
                    </p>
                </div>
            )}

            {done ? (
                <div className="text-center py-12 space-y-4">
                    <CheckCircle className="w-14 h-14 text-success mx-auto" />
                    <div>
                        <h2 className="font-mono font-bold text-xl uppercase tracking-tight">Importado</h2>
                        <p className="font-mono text-sm text-muted-foreground mt-1">
                            {validCount} ingresos agregados a la cuenta seleccionada.
                        </p>
                    </div>
                    <Link href="/transactions" className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-foreground text-background font-mono text-sm font-bold uppercase tracking-widest hover:opacity-80 active:scale-[0.98] transition-all">
                        Ver movimientos
                    </Link>
                </div>
            ) : (
                <>
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="paper-card p-8 rounded-2xl flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-black/5 transition-colors border-2 border-dashed border-black/10 hover:border-black/20"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="font-mono font-bold text-sm uppercase tracking-tight">
                                {fileName ?? "Seleccionar CSV de ingresos"}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground mt-1">
                                Plantilla validada: Income, Amount, Date, Month Classification, Type
                            </p>
                        </div>
                        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
                    </div>

                    {fileError && (
                        <div className="paper-card rounded-2xl p-4 border border-error/20 bg-error/5">
                            <p className="font-mono text-xs uppercase tracking-widest text-error">Archivo no valido</p>
                            <p className="font-mono text-sm mt-2">{fileError}</p>
                        </div>
                    )}

                    {mode === "rafa-income" && rows.length > 0 && (
                        <>
                            <div className="paper-card rounded-2xl p-4 space-y-4">
                                <div>
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Destino</p>
                                    <p className="font-mono text-sm font-bold uppercase mt-1">{user?.name || "Rafa"}</p>
                                </div>

                                <div>
                                    <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">
                                        Cuenta destino
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {accounts.map((account) => (
                                            <button
                                                key={account.id}
                                                type="button"
                                                onClick={() => setSelectedAccountId(account.id)}
                                                className={`rounded-2xl border p-3 text-left transition-all ${
                                                    effectiveAccountId === account.id
                                                        ? "border-primary bg-primary/10 shadow-sm"
                                                        : "border-black/10 bg-white/50 hover:bg-black/5"
                                                }`}
                                            >
                                                <p className="font-mono text-xs font-bold truncate">{account.name}</p>
                                                <p className="font-mono text-[10px] text-muted-foreground mt-1">
                                                    {account.provider || "Cuenta"} · {account.currency}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Buscar fila..."
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/5 border border-black/10 font-mono text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">
                                        {validCount} filas listas · {rows.filter((row) => isDuplicate(row)).length} duplicadas
                                    </p>
                                    <button onClick={resetState} className="p-1.5 rounded-lg hover:bg-error/5 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5 text-error opacity-60" />
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                                    {filteredRows.map(({ row, index: rowIndex }) => {
                                        const duplicate = isDuplicate(row);
                                        const active = selectedRows.has(rowIndex);
                                        return (
                                            <button
                                                key={`${row.description}-${row.date}-${rowIndex}`}
                                                onClick={() => row.valid && !duplicate && toggleRow(rowIndex)}
                                                disabled={!row.valid || duplicate}
                                                className={`w-full text-left paper-card p-3 rounded-xl flex items-start space-x-3 transition-all ${
                                                    active ? "ring-1 ring-primary" : ""
                                                } ${!row.valid || duplicate ? "opacity-45" : "hover:bg-black/5"}`}
                                            >
                                                <div className={`w-4 h-4 rounded border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all ${
                                                    active ? "bg-primary border-primary" : "border-black/20"
                                                }`}>
                                                    {active && <span className="text-white text-[8px] font-bold">✓</span>}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-mono text-xs font-bold truncate">{row.description}</p>
                                                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-success/10 text-success">
                                                            {row.category_name}
                                                        </span>
                                                        {row.adjustedByFallback && (
                                                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                                                                fallback
                                                            </span>
                                                        )}
                                                        {duplicate && (
                                                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/10 text-muted-foreground">
                                                                duplicado
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                                                        {row.date} · ${row.amount.toFixed(2)}
                                                    </p>
                                                    {row.month_label && (
                                                        <p className="font-mono text-[10px] text-muted-foreground truncate mt-1">
                                                            {row.month_label}
                                                        </p>
                                                    )}
                                                    {row.error && <p className="font-mono text-[10px] text-error mt-1">{row.error}</p>}
                                                </div>

                                                {!row.valid && (
                                                    <AlertCircle className="w-4 h-4 text-error opacity-70 flex-shrink-0 mt-0.5" />
                                                )}
                                                {row.valid && (
                                                    <FileText className="w-4 h-4 text-muted-foreground opacity-50 flex-shrink-0 mt-0.5" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleImport}
                                    disabled={validCount === 0 || importing || !effectiveAccountId}
                                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {importing ? "Importando..." : "Importar ingresos"}
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
