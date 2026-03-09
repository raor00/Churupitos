import { create } from "zustand";
import { Transaction, Category, Account } from "@/types";

interface TransactionState {
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
    addTransaction: (tx: Omit<Transaction, "id" | "created_at" | "updated_at">) => void;
    addCategory: (cat: Omit<Category, "id" | "created_at">) => void;
    // Other methods will go here
}

export const useTransactionStore = create<TransactionState>((set) => ({
    transactions: [],
    accounts: [
        { id: "a1", user_id: "system", name: "Efectivo USD", currency: "USD", balance: 1250.75, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: "a2", user_id: "system", name: "Banco Bs", currency: "VES", balance: 4500.50, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ],
    categories: [
        { id: "1", user_id: "system", name: "Food", icon: "shopping-cart", color: "#f00", type: "expense", monthly_budget: 300, is_default: true, created_at: new Date().toISOString() },
        { id: "2", user_id: "system", name: "Salary", icon: "briefcase", color: "#0f0", type: "income", is_default: true, created_at: new Date().toISOString() },
    ],
    addTransaction: (tx) => set((state) => ({
        transactions: [
            {
                ...tx,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            ...state.transactions,
        ],
    })),
    addCategory: (cat) => set((state) => ({
        categories: [
            ...state.categories,
            {
                ...cat,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
            }
        ]
    })),
}));
