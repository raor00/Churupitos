"use client";

import { KPICard } from "@/components/dashboard/KPICard";
import { RatesWidget } from "@/components/dashboard/RatesWidget";
import { WeeklyBarChart } from "@/components/dashboard/Charts/WeeklyBarChart";
import { useState } from "react";
import { AlertTriangle, Repeat, Target, Wallet } from "lucide-react";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRatesStore, getRate } from "@/lib/store/useRates";
import Link from "next/link";

export default function Home() {
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");
  const { accounts, transactions, user } = useCurrentUser();
  const ratesState = useRatesStore();
  const rate = getRate(ratesState);

  const toUSD = (amount: number, curr: string) => {
    if (curr === "USD" || curr === "USDT") return amount;
    if (curr === "VES") return amount / rate;
    if (curr === "EUR") return amount * 1.08;
    return amount;
  };

  const totalUSD = accounts.reduce((acc, a) => acc + toUSD(a.balance, a.currency), 0);
  const totalVES = totalUSD * rate;
  const currentBalance = currency === "USD" ? totalUSD : totalVES;
  const isLowBalance = totalUSD < 50;

  const monthNow = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthIncome = transactions
    .filter(tx => tx.type === "income" && tx.date.startsWith(monthNow))
    .reduce((s, tx) => s + toUSD(tx.amount, tx.currency), 0);
  const monthExpense = transactions
    .filter(tx => tx.type === "expense" && tx.date.startsWith(monthNow))
    .reduce((s, tx) => s + toUSD(tx.amount, tx.currency), 0);

  const greeting = user ? `Hola, ${user.name.split(" ")[0]}` : "Tus Churupitos";

  return (
    <div className="pb-28 pt-2 space-y-4">
      <header className="relative">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-mono tracking-tighter uppercase font-bold text-muted-foreground">
              {greeting} 👋
            </h1>
            <p className="font-mono text-xs mt-0.5 mb-2 text-muted-foreground">
              {new Date().toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <button
            onClick={() => setCurrency(c => c === "USD" ? "VES" : "USD")}
            className="flex items-center space-x-1 bg-black/5 hover:bg-black/10 transition-colors px-2 py-1 rounded-full text-xs font-mono font-bold"
          >
            <Repeat className="w-3 h-3" />
            <span>{currency}</span>
          </button>
        </div>
      </header>

      {isLowBalance && (
        <div className="bg-error/10 text-error border border-error/20 p-2 rounded-lg flex items-center justify-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-mono text-xs uppercase font-bold tracking-tight">
            ¡Te estás quedando sin churupitos!
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1">
        <Link href="/accounts" className="col-span-2">
          <KPICard
            title={`Churupitos (${currency})`}
            amount={currentBalance}
            currencyPrefix={currency === "USD" ? "$" : "Bs."}
            className="rounded-2xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
            icon={Wallet}
          />
        </Link>
        <KPICard
          title="Ingresos (mes)"
          amount={monthIncome}
          currencyPrefix="$"
          icon={Target}
          className="rounded-xl"
        />
        <KPICard
          title="Gastos (mes)"
          amount={monthExpense}
          currencyPrefix="$"
          icon={Wallet}
          className="rounded-xl"
        />
      </div>

      <RatesWidget />
      <RecentTransactions />

      <div className="pt-1">
        <h2 className="text-sm font-mono tracking-tight text-muted-foreground uppercase mb-2">
          Análisis de Movimientos
        </h2>
        <WeeklyBarChart />
      </div>
    </div>
  );
}
