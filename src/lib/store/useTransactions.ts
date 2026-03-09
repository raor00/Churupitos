import { create } from "zustand";
import { Transaction, Category, Account } from "@/types";
import { supabase } from "@/lib/supabase/client";

interface TransactionState {
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
    isLoading: boolean;
    error: string | null;

    // Fetch initial data
    fetchData: (userId: string) => Promise<void>;

    addTransaction: (tx: Omit<Transaction, "id" | "created_at" | "updated_at">) => Promise<void>;
    addCategory: (cat: Omit<Category, "id" | "created_at">) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    addAccount: (acc: Omit<Account, "id" | "created_at" | "updated_at">) => Promise<void>;
    updateAccountBalance: (accountId: string, newBalance: number) => Promise<void>;
    deleteAccount: (accountId: string) => Promise<void>;
    seedForUser: (userId: string) => Promise<void>;
    importTransactions: (txs: Omit<Transaction, "id" | "created_at" | "updated_at">[]) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
    transactions: [],
    categories: [],
    accounts: [],
    isLoading: false,
    error: null,

    fetchData: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const [txRes, catRes, accRes] = await Promise.all([
                supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
                supabase.from('categories').select('*').eq('user_id', userId),
                supabase.from('accounts').select('*').eq('user_id', userId)
            ]);

            if (txRes.error) throw txRes.error;
            if (catRes.error) throw catRes.error;
            if (accRes.error) throw accRes.error;

            set({
                transactions: txRes.data as Transaction[],
                categories: catRes.data as Category[],
                accounts: accRes.data as Account[],
                isLoading: false
            });
        } catch (err: any) {
            console.error("Error fetching data:", err);
            set({ error: err.message, isLoading: false });
        }
    },

    addTransaction: async (tx) => {
        try {
            // 1. Calculate new balance based on the current state
            const targetAccount = get().accounts.find(a => a.id === tx.account_id);
            if (!targetAccount) throw new Error("Account not found");

            let changeAmount = 0;
            if (targetAccount.currency === tx.currency) {
                changeAmount = tx.amount;
            } else if (targetAccount.currency === "VES") {
                changeAmount = tx.amount_ves || 0;
            } else {
                changeAmount = (tx.amount_ves || 0) / (tx.rate_used || 1);
            }

            const newBalance = tx.type === "expense"
                ? targetAccount.balance - changeAmount
                : targetAccount.balance + changeAmount;

            // 2. Insert Transaction into Supabase
            const { data: newTx, error: txError } = await supabase
                .from('transactions')
                .insert([tx])
                .select()
                .single();
            if (txError) throw txError;

            // 3. Update Account Balance in Supabase
            const { data: updatedAcc, error: accError } = await supabase
                .from('accounts')
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq('id', targetAccount.id)
                .select()
                .single();
            if (accError) throw accError;

            // 4. Update local state
            set((state) => ({
                transactions: [newTx as Transaction, ...state.transactions],
                accounts: state.accounts.map(acc => acc.id === updatedAcc.id ? updatedAcc as Account : acc)
            }));
        } catch (err: any) {
            console.error("Error adding transaction:", err);
            set({ error: err.message });
        }
    },

    addCategory: async (cat) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([cat])
                .select()
                .single();
            if (error) throw error;
            set((state) => ({ categories: [...state.categories, data as Category] }));
        } catch (err: any) {
            console.error("Error adding category:", err);
            set({ error: err.message });
        }
    },

    addAccount: async (acc) => {
        try {
            const { data, error } = await supabase
                .from('accounts')
                .insert([{ ...acc }])
                .select()
                .single();
            if (error) throw error;
            set((state) => ({ accounts: [...state.accounts, data as Account] }));
        } catch (err: any) {
            console.error("Error adding account:", err);
            set({ error: err.message });
        }
    },

    updateCategory: async (id, updates) => {
        try {
            const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
            if (error) throw error;
            set((state) => ({ categories: state.categories.map(c => c.id === id ? { ...c, ...data as Category } : c) }));
        } catch (err: any) {
            console.error(err);
        }
    },

    deleteCategory: async (id) => {
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
        } catch (err: any) {
            console.error(err);
        }
    },

    updateAccountBalance: async (accountId, newBalance) => {
        try {
            const { data, error } = await supabase.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', accountId).select().single();
            if (error) throw error;
            set((state) => ({ accounts: state.accounts.map(a => a.id === accountId ? { ...a, ...data as Account } : a) }));
        } catch (err: any) {
            console.error(err);
        }
    },

    deleteAccount: async (accountId) => {
        try {
            const { error } = await supabase.from('accounts').delete().eq('id', accountId);
            if (error) throw error;
            set((state) => ({ accounts: state.accounts.filter(a => a.id !== accountId) }));
        } catch (err: any) {
            console.error(err);
        }
    },

    seedForUser: async (userId) => {
        try {
            const { data: existing } = await supabase.from('categories').select('id').eq('user_id', userId).limit(1);
            if (existing && existing.length > 0) return;

            const seedCats = [
                { user_id: userId, name: "Comida", icon: "utensils", color: "#cc0000", type: "expense", monthly_budget: 300, is_default: true },
                { user_id: userId, name: "Transporte", icon: "car", color: "#004B87", type: "expense", monthly_budget: 100, is_default: true },
                { user_id: userId, name: "Salario", icon: "briefcase", color: "#00693C", type: "income", is_default: true },
            ];

            const seedAcc = [
                { user_id: userId, name: "Efectivo", icon: "Banknote", color: "#16a34a", currency: "USD", balance: 500 }
            ];

            await Promise.all([
                supabase.from('categories').insert(seedCats),
                supabase.from('accounts').insert(seedAcc)
            ]);

        } catch (err: any) {
            console.error("Error seeding data:", err);
        }
    },

    importTransactions: async (txs) => {
        try {
            const { data, error } = await supabase.from('transactions').insert(txs).select();
            if (error) throw error;
            set((state) => ({ transactions: [...Array.isArray(data) ? data : [data], ...state.transactions] }));
        } catch (err: any) {
            console.error("Error importing txs:", err);
        }
    }
}));
