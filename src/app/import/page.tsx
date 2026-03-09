"use client";

import { useState, useRef } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { Transaction } from "@/types";

type PreviewRow = {
    description: string;
    amount: number;
    currency: "USD" | "VES" | "EUR" | "USDT";
    type: "expense" | "income";
    date: string;
    category_id: string;
    valid: boolean;
    error?: string;
};

/** Parse a Notion CSV export. Flexible — tries multiple column name variants. */
function parseNotionCSV(csv: string, userId: string, categoryFallbackId: string, rate: number): PreviewRow[] {
    const lines = csv.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];

    // Parse headers
    const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());

    const col = (names: string[]) => {
        for (const n of names) {
            const idx = headers.findIndex(h => h.includes(n));
            if (idx !== -1) return idx;
        }
        return -1;
    };

    const descCol = col(["descripcion", "description", "concepto", "name", "title", "nombre"]);
    const amountCol = col(["monto", "amount", "valor", "value", "total"]);
    const typeCol = col(["tipo", "type", "gasto", "ingreso", "categoria"]);
    const dateCol = col(["fecha", "date", "created"]);
    const currencyCol = col(["moneda", "currency", "divisa"]);

    return lines.slice(1).map((line) => {
        const cells = parseCSVRow(line);
        const raw = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");

        const description = raw(descCol) || "Sin descripción";
        const amountStr = raw(amountCol).replace(/[^0-9.,]/g, "").replace(",", ".");
        const amount = parseFloat(amountStr);
        const typeRaw = raw(typeCol).toLowerCase();
        const type: "expense" | "income" =
            typeRaw.includes("ingreso") || typeRaw.includes("income") ? "income" : "expense";
        const dateRaw = raw(dateCol);
        const date = parseDate(dateRaw) ?? new Date().toISOString().split("T")[0];
        const currRaw = raw(currencyCol).toUpperCase();
        const currency: "USD" | "VES" | "EUR" | "USDT" =
            ["USD", "VES", "EUR", "USDT"].includes(currRaw) ? (currRaw as any) : "USD";

        const valid = !isNaN(amount) && amount > 0 && !!description;

        return {
            description,
            amount: isNaN(amount) ? 0 : amount,
            currency,
            type,
            date,
            category_id: categoryFallbackId,
            valid,
            error: !valid ? "Monto inválido o descripción vacía" : undefined,
        };
    });
}

function parseCSVRow(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function parseDate(raw: string): string | null {
    if (!raw) return null;
    // Try common formats
    const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const slashMatch = raw.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/);
    if (slashMatch) {
        const [, d, m, y] = slashMatch;
        const year = y.length === 2 ? `20${y}` : y;
        return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return null;
}

export default function ImportPage() {
    const { categories, importTransactions, userId } = useCurrentUser();
    const ratesState = useRatesStore();
    const rate = getRate(ratesState);
    const fileRef = useRef<HTMLInputElement>(null);

    const [rows, setRows] = useState<PreviewRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [done, setDone] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

    const fallbackCategoryId = categories.find(c => c.type === "expense")?.id ?? "";

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setDone(false);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const parsed = parseNotionCSV(text, userId, fallbackCategoryId, rate);
            setRows(parsed);
            setSelectedRows(new Set(parsed.map((_, i) => i).filter(i => parsed[i].valid)));
        };
        reader.readAsText(file, "utf-8");
    };

    const toggleRow = (i: number) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i);
            else next.add(i);
            return next;
        });
    };

    const handleImport = () => {
        setImporting(true);
        const toImport = rows
            .filter((_, i) => selectedRows.has(i) && rows[i].valid)
            .map(r => ({
                user_id: userId,
                type: r.type,
                description: r.description,
                amount: r.amount,
                currency: r.currency,
                amount_ves: r.currency === "VES" ? r.amount : r.amount * rate,
                rate_used: r.currency === "VES" ? 1 : rate,
                rate_type: "manual" as const,
                category_id: r.category_id || fallbackCategoryId,
                account_id: undefined,
                date: r.date,
            }));

        importTransactions(toImport);
        setImporting(false);
        setDone(true);
    };

    const validCount = rows.filter((r, i) => r.valid && selectedRows.has(i)).length;

    return (
        <div className="pb-28 pt-4 space-y-6">
            <header className="flex items-center space-x-4">
                <Link href="/" className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">Importar CSV</h1>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Notion, Excel, cualquier formato</p>
                </div>
            </header>

            {done ? (
                <div className="text-center py-12 space-y-4">
                    <CheckCircle className="w-14 h-14 text-success mx-auto" />
                    <div>
                        <h2 className="font-mono font-bold text-xl uppercase tracking-tight">¡Importado!</h2>
                        <p className="font-mono text-sm text-muted-foreground mt-1">{validCount} transacciones registradas.</p>
                    </div>
                    <Link href="/transactions" className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-foreground text-background font-mono text-sm font-bold uppercase tracking-widest hover:opacity-80 active:scale-[0.98] transition-all">
                        Ver movimientos
                    </Link>
                </div>
            ) : (
                <>
                    {/* Upload area */}
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="paper-card p-8 rounded-2xl flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-black/5 transition-colors border-2 border-dashed border-black/10 hover:border-black/20"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="font-mono font-bold text-sm uppercase tracking-tight">
                                {fileName ?? "Seleccionar archivo CSV"}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground mt-1">
                                Exporta de Notion → ••• → Export → CSV
                            </p>
                        </div>
                        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
                    </div>

                    {/* Preview */}
                    {rows.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">
                                    {validCount} de {rows.length} filas seleccionadas
                                </p>
                                <button onClick={() => setRows([])} className="p-1.5 rounded-lg hover:bg-error/5 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5 text-error opacity-60" />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {rows.map((row, i) => (
                                    <button
                                        key={i}
                                        onClick={() => row.valid && toggleRow(i)}
                                        disabled={!row.valid}
                                        className={`w-full text-left paper-card p-3 rounded-xl flex items-center space-x-3 transition-all ${selectedRows.has(i) && row.valid ? "ring-1 ring-primary" : ""} ${!row.valid ? "opacity-40" : "hover:bg-black/5"}`}
                                    >
                                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedRows.has(i) && row.valid ? "bg-primary border-primary" : "border-black/20"}`}>
                                            {selectedRows.has(i) && row.valid && <span className="text-white text-[8px] font-bold">✓</span>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-mono text-xs font-bold truncate">{row.description}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground">
                                                {row.date} · {row.type === "expense" ? "-" : "+"}{row.currency === "USD" || row.currency === "USDT" ? "$" : "Bs."}{row.amount.toFixed(2)}
                                            </p>
                                        </div>
                                        {!row.valid && (
                                            <div className="flex-shrink-0">
                                                <AlertCircle className="w-4 h-4 text-error opacity-60" />
                                            </div>
                                        )}
                                        {row.valid && (
                                            <div className={`flex-shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${row.type === "expense" ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>
                                                {row.type === "expense" ? "gasto" : "ingreso"}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={validCount === 0 || importing}
                                className="w-full bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40"
                            >
                                {importing ? "Importando..." : `Importar ${validCount} transacciones`}
                            </button>
                        </div>
                    )}

                    {/* Format hint */}
                    <div className="paper-card p-4 rounded-xl">
                        <div className="flex items-start space-x-3">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-mono text-xs font-bold uppercase tracking-tight">Columnas esperadas</p>
                                <p className="font-mono text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                    <code>Descripcion</code>, <code>Monto</code>, <code>Tipo</code> (gasto/ingreso), <code>Fecha</code>, <code>Moneda</code> (USD/VES/EUR)<br />
                                    También acepta: name, amount, type, date, currency
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
