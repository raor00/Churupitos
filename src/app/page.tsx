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
import { motion, AnimatePresence } from "framer-motion";

// ─── Balance-based motivational messages ─────────────────────────────────────
type MotivLevel = "broke" | "low" | "ok" | "good" | "rich";

function getMotivLevel(usd: number): MotivLevel {
  if (usd <= 0) return "broke";
  if (usd < 50) return "low";
  if (usd < 300) return "ok";
  if (usd < 1000) return "good";
  return "rich";
}

const MOTIV_CONFIG: Record<MotivLevel, { icon: string; messages: string[]; color: string }> = {
  broke: {
    icon: "😰",
    color: "text-error",
    messages: [
      "Esto está más pelado que rodilla de ciclista 🚴",
      "La billetera llora, bro. Hora de conseguir más churupitos.",
      "¿Gastos o magia negra? El saldo desapareció.",
    ],
  },
  low: {
    icon: "😬",
    color: "text-orange-500",
    messages: [
      "Queda poca gasolina en el tanque… ⛽",
      "Modo ahorro activado. Nada de antojos.",
      "Los churupitos están escasos, cuídalos.",
    ],
  },
  ok: {
    icon: "😊",
    color: "text-yellow-600",
    messages: [
      "Vas bien, pero sin derrochar. 💪",
      "Steady. Keep the grind going.",
      "Ni rico ni pelado. El punto justo.",
    ],
  },
  good: {
    icon: "😎",
    color: "text-success",
    messages: [
      "Eso es. Los churupitos fluyen. 🤑",
      "Buen momento para ahorrar un poco más.",
      "Saldo bonito. Que no se vea muy solo.",
    ],
  },
  rich: {
    icon: "🤑",
    color: "text-success",
    messages: [
      "¡Mira esos churupitos! Impresionante. 🏆",
      "El saldo habla por sí solo. Respeto.",
      "¿Inversiones? Con ese saldo, ¿por qué no?",
    ],
  },
};

// Deterministic pick based on date (changes daily)
function getDailyMessage(level: MotivLevel): { icon: string; text: string; color: string } {
  const cfg = MOTIV_CONFIG[level];
  const dayIndex = new Date().getDate() % cfg.messages.length;
  return { icon: cfg.icon, text: cfg.messages[dayIndex], color: cfg.color };
}

// Greeting icon based on hour
function getGreetingIcon(hour: number): string {
  if (hour < 6) return "🌙";
  if (hour < 12) return "☀️";
  if (hour < 18) return "👋";
  return "🌆";
}

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

  const monthNow = new Date().toISOString().slice(0, 7);
  const monthIncome = transactions
    .filter(tx => tx.type === "income" && tx.date.startsWith(monthNow))
    .reduce((s, tx) => s + toUSD(tx.amount, tx.currency), 0);
  const monthExpense = transactions
    .filter(tx => tx.type === "expense" && tx.date.startsWith(monthNow))
    .reduce((s, tx) => s + toUSD(tx.amount, tx.currency), 0);

  const hour = new Date().getHours();
  const greetingIcon = getGreetingIcon(hour);
  const firstName = user?.name.split(" ")[0] ?? "Rafa";
  const motivLevel = getMotivLevel(totalUSD);
  const motiv = getDailyMessage(motivLevel);

  return (
    <div className="pb-safe pt-2 space-y-4">
      <header className="relative">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            {/* Animated greeting line */}
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xl font-mono tracking-tighter uppercase font-bold text-muted-foreground flex items-center gap-2"
            >
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, 0] }}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
                className="inline-block origin-bottom-right text-xl"
              >
                {greetingIcon}
              </motion.span>
              Hola, {firstName}
            </motion.h1>

            <p className="font-mono text-xs mt-0.5 text-muted-foreground">
              {new Date().toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}
            </p>

            {/* Motivational message */}
            <motion.p
              key={motivLevel}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`font-mono text-[11px] mt-1.5 font-bold ${motiv.color}`}
            >
              {motiv.icon} {motiv.text}
            </motion.p>
          </div>
          <button
            onClick={() => setCurrency(c => c === "USD" ? "VES" : "USD")}
            className="flex items-center space-x-1 bg-black/5 hover:bg-black/10 transition-colors px-2 py-1 rounded-full text-xs font-mono font-bold flex-shrink-0 ml-2"
          >
            <Repeat className="w-3 h-3" />
            <span>{currency}</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isLowBalance && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-error/10 text-error border border-error/20 p-2 rounded-lg flex items-center justify-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="font-mono text-xs uppercase font-bold tracking-tight">
              ¡Te estás quedando sin churupitos!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
