import { create } from "zustand";
import { Transaction, Category, Account } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { buildDefaultCategorySeed, categoryIdentity } from "@/lib/categories/catalog";
import { deserializeAccountFromDb, serializeAccountForDb } from "@/lib/accounts/accountMeta";
import {
    buildTransactionDerivedFields,
    getSignedTransactionImpact,
    isBalanceNegative,
    roundBalance,
} from "@/lib/transactions/amounts";

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
    clearStore: () => void;

    addTransaction: (tx: Omit<Transaction, "id" | "created_at" | "updated_at">) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Omit<Transaction, "id" | "created_at" | "user_id">>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
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

    clearStore: () => {
        set({ transactions: [], categories: [], accounts: [], isLoading: false, error: null });
    },

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
        set({ error: null });
        try {
            const targetAccount = get().accounts.find(a => a.id === tx.account_id);
            if (!targetAccount) throw new Error("Account not found");
            const normalizedTx = { ...tx, ...buildTransactionDerivedFields(tx) };
            const balanceImpact = getSignedTransactionImpact(normalizedTx, targetAccount.currency);
            const newBalance = roundBalance(targetAccount.balance + balanceImpact);

            if (normalizedTx.type === "expense" && isBalanceNegative(newBalance)) {
                throw new Error("No tienes saldo suficiente en esa cuenta para registrar ese gasto.");
            }

            const { data: newTx, error: txError } = await supabase
                .from('transactions')
                .insert([normalizedTx])
                .select()
                .single();
            if (txError) throw txError;

            const { data: updatedAcc, error: accError } = await supabase
                .from('accounts')
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq('id', targetAccount.id)
                .select()
                .single();
            if (accError) throw accError;

            const normalizedUpdatedAcc = deserializeAccountFromDb(updatedAcc as Account);
            set((state) => ({
                transactions: [newTx as Transaction, ...state.transactions],
                accounts: state.accounts.map(acc => acc.id === updatedAcc.id ? normalizedUpdatedAcc : acc)
            }));
        } catch (err: unknown) {
            console.error("Error adding transaction:", err);
            const message = getErrorMessage(err);
            set({ error: message });
            throw err instanceof Error ? err : new Error(message);
        }
    },

    updateTransaction: async (id, updates) => {
        set({ error: null });
        try {
            const state = get();
            const oldTx = state.transactions.find(tx => tx.id === id);
            if (!oldTx) throw new Error("Transaction not found");
            const nextTx = {
                ...oldTx,
                ...updates,
                ...buildTransactionDerivedFields({
                    amount: updates.amount ?? oldTx.amount,
                    currency: updates.currency ?? oldTx.currency,
                    amount_ves: updates.amount_ves ?? oldTx.amount_ves,
                    rate_used: updates.rate_used ?? oldTx.rate_used,
                }),
            } as Transaction;
            const oldAccount = state.accounts.find(a => a.id === oldTx.account_id);
            const nextAccount = state.accounts.find(a => a.id === nextTx.account_id);

            if (!oldAccount || !nextAccount) {
                throw new Error("Account not found");
            }

            const oldImpact = getSignedTransactionImpact(oldTx, oldAccount.currency);
            const oldAccountBalanceWithoutTx = roundBalance(oldAccount.balance - oldImpact);
            const nextImpact = getSignedTransactionImpact(nextTx, nextAccount.currency);
            const nextAccountProjectedBalance =
                oldAccount.id === nextAccount.id
                    ? roundBalance(oldAccountBalanceWithoutTx + nextImpact)
                    : roundBalance(nextAccount.balance + nextImpact);

            if (nextTx.type === "expense" && isBalanceNegative(nextAccountProjectedBalance)) {
                throw new Error("No tienes saldo suficiente en esa cuenta para guardar ese gasto.");
            }

            const { data, error } = await supabase
                .from('transactions')
                .update({
                    ...updates,
                    amount_ves: nextTx.amount_ves,
                    rate_used: nextTx.rate_used,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;

            const newTx = data as Transaction;
            if (oldAccount.id === nextAccount.id) {
                const { data: updatedAcc, error: accErr } = await supabase
                    .from('accounts')
                    .update({ balance: nextAccountProjectedBalance, updated_at: new Date().toISOString() })
                    .eq('id', oldAccount.id)
                    .select()
                    .single();
                if (accErr) throw accErr;

                const normalizedAcc = deserializeAccountFromDb(updatedAcc as Account);
                set((s) => ({
                    transactions: s.transactions.map(tx => tx.id === id ? newTx : tx),
                    accounts: s.accounts.map(a => a.id === oldAccount.id ? normalizedAcc : a),
                }));
                return;
            }

            const [updatedOldAccRes, updatedNextAccRes] = await Promise.all([
                supabase
                    .from('accounts')
                    .update({ balance: oldAccountBalanceWithoutTx, updated_at: new Date().toISOString() })
                    .eq('id', oldAccount.id)
                    .select()
                    .single(),
                supabase
                    .from('accounts')
                    .update({ balance: nextAccountProjectedBalance, updated_at: new Date().toISOString() })
                    .eq('id', nextAccount.id)
                    .select()
                    .single(),
            ]);

            if (updatedOldAccRes.error) throw updatedOldAccRes.error;
            if (updatedNextAccRes.error) throw updatedNextAccRes.error;

            const normalizedOldAcc = deserializeAccountFromDb(updatedOldAccRes.data as Account);
            const normalizedNextAcc = deserializeAccountFromDb(updatedNextAccRes.data as Account);

            set((s) => ({
                transactions: s.transactions.map(tx => tx.id === id ? newTx : tx),
                accounts: s.accounts.map((account) => {
                    if (account.id === normalizedOldAcc.id) return normalizedOldAcc;
                    if (account.id === normalizedNextAcc.id) return normalizedNextAcc;
                    return account;
                }),
            }));
        } catch (err: unknown) {
            console.error("Error updating transaction:", err);
            const message = getErrorMessage(err);
            set({ error: message });
            throw err instanceof Error ? err : new Error(message);
        }
    },

    deleteTransaction: async (id) => {
        set({ error: null });
        try {
            const state = get();
            const tx = state.transactions.find(t => t.id === id);
            if (!tx) throw new Error("Transaction not found");
            const account = state.accounts.find(a => a.id === tx.account_id);

            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;

            if (account) {
                const newBalance = roundBalance(account.balance - getSignedTransactionImpact(tx, account.currency));
                const { data: updatedAcc, error: accErr } = await supabase
                    .from('accounts')
                    .update({ balance: newBalance, updated_at: new Date().toISOString() })
                    .eq('id', account.id)
                    .select()
                    .single();
                if (accErr) throw accErr;

                const normalizedAcc = deserializeAccountFromDb(updatedAcc as Account);
                set((s) => ({
                    transactions: s.transactions.filter(t => t.id !== id),
                    accounts: s.accounts.map(a => a.id === account.id ? normalizedAcc : a),
                }));
            } else {
                set((s) => ({ transactions: s.transactions.filter(t => t.id !== id) }));
            }
        } catch (err: unknown) {
            console.error("Error deleting transaction:", err);
            const message = getErrorMessage(err);
            set({ error: message });
            throw err instanceof Error ? err : new Error(message);
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
