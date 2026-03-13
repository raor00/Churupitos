import type { Account, Transaction } from "@/types";

const EUR_TO_USD_RATE = 1.08;
const BALANCE_EPSILON = 0.000001;

type SupportedCurrency = Account["currency"] | Transaction["currency"];

export function normalizeExchangeRate(rate?: number | null) {
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
        return 1;
    }

    return rate;
}

export function convertAmountToUsd(
    amount: number,
    currency: SupportedCurrency,
    rate: number
) {
    const safeRate = normalizeExchangeRate(rate);

    switch (currency) {
        case "VES":
            return amount / safeRate;
        case "EUR":
            return amount * EUR_TO_USD_RATE;
        case "USD":
        case "USDT":
        default:
            return amount;
    }
}

export function convertUsdToCurrency(
    amountUsd: number,
    currency: SupportedCurrency,
    rate: number
) {
    const safeRate = normalizeExchangeRate(rate);

    switch (currency) {
        case "VES":
            return amountUsd * safeRate;
        case "EUR":
            return amountUsd / EUR_TO_USD_RATE;
        case "USD":
        case "USDT":
        default:
            return amountUsd;
    }
}

export function buildTransactionDerivedFields(
    tx: Pick<Transaction, "amount" | "currency"> & Partial<Pick<Transaction, "amount_ves" | "rate_used">>
) {
    const rate = normalizeExchangeRate(tx.rate_used);
    const amountUsd = convertAmountToUsd(tx.amount, tx.currency, rate);

    return {
        rate_used: rate,
        amount_ves: tx.currency === "VES" ? tx.amount : amountUsd * rate,
    };
}

export function getTransactionAmountInAccountCurrency(
    tx: Pick<Transaction, "amount" | "currency" | "amount_ves" | "rate_used">,
    accountCurrency: Account["currency"]
) {
    const rate = normalizeExchangeRate(tx.rate_used);

    if (tx.currency === accountCurrency) {
        return tx.amount;
    }

    if (accountCurrency === "VES") {
        if (typeof tx.amount_ves === "number" && Number.isFinite(tx.amount_ves)) {
            return tx.amount_ves;
        }

        const amountUsd = convertAmountToUsd(tx.amount, tx.currency, rate);
        return convertUsdToCurrency(amountUsd, accountCurrency, rate);
    }

    const amountUsd =
        tx.currency === "VES" && typeof tx.amount_ves === "number" && Number.isFinite(tx.amount_ves)
            ? tx.amount_ves / rate
            : convertAmountToUsd(tx.amount, tx.currency, rate);

    return convertUsdToCurrency(amountUsd, accountCurrency, rate);
}

export function getSignedTransactionImpact(
    tx: Pick<Transaction, "type" | "amount" | "currency" | "amount_ves" | "rate_used">,
    accountCurrency: Account["currency"]
) {
    const amount = getTransactionAmountInAccountCurrency(tx, accountCurrency);
    return tx.type === "expense" ? -amount : amount;
}

export function roundBalance(value: number) {
    if (Math.abs(value) < BALANCE_EPSILON) {
        return 0;
    }

    return Number(value.toFixed(6));
}

export function isBalanceNegative(value: number) {
    return value < -BALANCE_EPSILON;
}
