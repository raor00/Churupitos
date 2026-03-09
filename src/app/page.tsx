import { KPICard } from "@/components/dashboard/KPICard";
import { RatesWidget } from "@/components/dashboard/RatesWidget";
import { WeeklyBarChart } from "@/components/dashboard/Charts/WeeklyBarChart";
import { useState } from "react";
import { AlertTriangle, Repeat } from "lucide-react";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Wallet, PiggyBank, Target } from "lucide-react";

export default function Home() {
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");

  // Mock balances (will come from store/supabase later)
  const balances = {
    USD: 1250.75,
    VES: 4500.50
  };

  const currentBalance = balances[currency];
  const isLowBalance = currentBalance < 50; // Threshold for low balance

  return (
    <div className="pb-24 pt-2 space-y-4">
      <header className="relative">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-mono tracking-tighter uppercase font-bold text-muted-foreground">
              Tus Churupitos son...
            </h1>
            <p className="font-mono text-xs mt-0.5 mb-2">
              Sincronizado.
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

      {/* Low Balance Warning */}
      {isLowBalance && (
        <div className="bg-error/10 text-error border border-error/20 p-2 rounded-lg flex items-center justify-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-mono text-xs uppercase font-bold tracking-tight">
            ¡Te estás quedando sin churupitos!
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        <KPICard
          title={`Total Balance (${currency})`}
          amount={currentBalance}
          currencyPrefix={currency === "USD" ? "$" : "Bs."}
          className="col-span-2 rounded-2xl"
          icon={Wallet}
        />
        <KPICard
          title="Ingresos"
          amount={850.00}
          currencyPrefix="$"
          icon={Target}
          trend={12}
          className="rounded-xl"
        />
        <KPICard
          title="Gastos"
          amount={342.25}
          currencyPrefix="$"
          icon={Wallet}
          trend={-5}
          className="rounded-xl"
        />
      </div>

      <RatesWidget />

      <div className="pt-2">
        <h2 className="text-sm font-mono tracking-tight text-muted-foreground uppercase mb-2">
          Análisis de Movimientos
        </h2>
        <WeeklyBarChart />
      </div>

      <RecentTransactions />
    </div>
  );
}
