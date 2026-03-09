import { create } from "zustand";
import { Transaction, Category, Account } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { buildDefaultCategorySeed, categoryIdentity } from "@/lib/categories/catalog";
import { deserializeAccountFromDb, serializeAccountForDb } from "@/lib/accounts/accountMeta";

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Unknown error");
const getErrorDetails = (error: unknown) => {
    if (!error || typeof error !== "object") return null;
    return JSON.parse(JSON.stringify(error));
};

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
                accounts: (accRes.data as Account[]).map(deserializeAccountFromDb),
                isLoading: false
            });
        } catch (err: unknown) {
            console.error("Error fetching data:", err);
            set({ error: getErrorMessage(err), isLoading: false });
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
            const normalizedUpdatedAcc = deserializeAccountFromDb(updatedAcc as Account);
            set((state) => ({
                transactions: [newTx as Transaction, ...state.transactions],
                accounts: state.accounts.map(acc => acc.id === updatedAcc.id ? normalizedUpdatedAcc : acc)
            }));
        } catch (err: unknown) {
            console.error("Error adding transaction:", err);
            set({ error: getErrorMessage(err) });
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
        } catch (err: unknown) {
            console.error("Error adding category:", err);
            set({ error: getErrorMessage(err) });
        }
    },

    addAccount: async (acc) => {
        try {
            const dbAccount = serializeAccountForDb(acc);
            const { data, error } = await supabase
                .from('accounts')
                .insert([dbAccount])
                .select()
                .single();
            if (error) throw error;
            set((state) => ({ accounts: [...state.accounts, deserializeAccountFromDb(data as Account)] }));
        } catch (err: unknown) {
            console.error("Error adding account:", err);
            set({ error: getErrorMessage(err) });
        }
    },

    updateCategory: async (id, updates) => {
        try {
            const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
            if (error) throw error;
            set((state) => ({ categories: state.categories.map(c => c.id === id ? { ...c, ...data as Category } : c) }));
        } catch (err: unknown) {
            console.error(err);
        }
    },

    deleteCategory: async (id) => {
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
        } catch (err: unknown) {
            console.error(err);
        }
    },

    updateAccountBalance: async (accountId, newBalance) => {
        try {
            const { data, error } = await supabase.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', accountId).select().single();
            if (error) throw error;
            const normalizedAccount = deserializeAccountFromDb(data as Account);
            set((state) => ({ accounts: state.accounts.map(a => a.id === accountId ? { ...a, ...normalizedAccount } : a) }));
        } catch (err: unknown) {
            console.error(err);
        }
    },

    deleteAccount: async (accountId) => {
        try {
            const { error } = await supabase.from('accounts').delete().eq('id', accountId);
            if (error) throw error;
            set((state) => ({ accounts: state.accounts.filter(a => a.id !== accountId) }));
        } catch (err: unknown) {
            console.error(err);
        }
    },

    seedForUser: async (userId) => {
        try {
            const [catRes, accRes] = await Promise.all([
                supabase.from('categories').select('id, name, type').eq('user_id', userId),
                supabase.from('accounts').select('id').eq('user_id', userId).limit(1),
            ]);
            if (catRes.error) {
                console.error("seedForUser: categories read failed", getErrorDetails(catRes.error));
                throw catRes.error;
            }
            if (accRes.error) {
                console.error("seedForUser: accounts read failed", getErrorDetails(accRes.error));
                throw accRes.error;
            }

            const existingCategoryKeys = new Set(
                (catRes.data ?? []).map((cat) => categoryIdentity(cat.type as "income" | "expense", cat.name))
            );

            const missingCategories = buildDefaultCategorySeed(userId).filter(
                (cat) => !existingCategoryKeys.has(categoryIdentity(cat.type, cat.name))
            );

            if (missingCategories.length > 0) {
                const { error: insertCatError } = await supabase.from('categories').insert(missingCategories);
                if (insertCatError) {
                    console.error("seedForUser: categories insert failed", getErrorDetails(insertCatError));
                    throw insertCatError;
                }
            }

            if (!accRes.data || accRes.data.length === 0) {
                const seedAcc: Array<Omit<Account, "id" | "created_at" | "updated_at">> = [
                    {
                        user_id: userId,
                        name: "Efectivo USD",
                        provider: "Efectivo",
                        bank_id: "cash-usd",
                        account_scope: "international",
                        icon: "Banknote",
                        display_icon: "Banknote",
                        color: "#16a34a",
                        currency: "USD",
                        balance: 500,
                    },
                    {
                        user_id: userId,
                        name: "Banco Nacional",
                        provider: "Banesco",
                        bank_id: "banesco",
                        account_scope: "national",
                        icon: "Landmark",
                        display_icon: "Landmark",
                        color: "#00693C",
                        currency: "VES",
                        balance: 0,
                    },
                ];
                const seedAccForDb = seedAcc.map((account) =>
                    serializeAccountForDb(account as Omit<Account, "id" | "created_at" | "updated_at">)
                );
                const { error: insertAccError } = await supabase.from('accounts').insert(seedAccForDb);
                if (insertAccError) {
                    console.error("seedForUser: accounts insert failed", getErrorDetails(insertAccError));
                    throw insertAccError;
                }
            }

            await get().fetchData(userId);
        } catch (err: unknown) {
            console.error("Error seeding data:", getErrorDetails(err) ?? err);
        }
    },

    importTransactions: async (txs) => {
        try {
            const { data, error } = await supabase.from('transactions').insert(txs).select();
            if (error) throw error;
            set((state) => ({ transactions: [...Array.isArray(data) ? data : [data], ...state.transactions] }));
        } catch (err: unknown) {
            console.error("Error importing txs:", err);
        }
    }
}));
