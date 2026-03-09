"use client";

import { useAuthStore } from "@/lib/store/useAuth";
import { useTransactionStore } from "@/lib/store/useTransactions";
import { useBucketStore } from "@/lib/store/useBuckets";
import { Transaction, Category, Account } from "@/types";
import { Bucket } from "@/lib/store/useBuckets";

/**
 * Central hook that returns data scoped to the currently authenticated user.
 * Use this in all pages instead of accessing stores directly.
 */
export function useCurrentUser() {
    const { currentUserId, getCurrentUser, isAuthenticated } = useAuthStore();
    const txStore = useTransactionStore();
    const bucketStore = useBucketStore();

    // Resolve legacy local ID to real Supabase UUID
    const rawId = currentUserId ?? "__demo__";
    const userId = rawId === "rafa-default" ? "f6f1f8a4-47d8-4c13-9123-b8f7cf2fe001" : rawId;

    return {
        user: getCurrentUser(),
        userId,
        isAuthenticated,

        // Data
        transactions: txStore.transactions,
        accounts: txStore.accounts,
        categories: txStore.categories,
        buckets: bucketStore.getBuckets ? bucketStore.getBuckets(userId) : [],

        // Transaction mutations
        addTransaction: async (tx: Omit<Transaction, "id" | "created_at" | "updated_at" | "user_id">) =>
            await txStore.addTransaction({ ...tx, user_id: userId }),
        updateTransaction: txStore.updateTransaction,
        deleteTransaction: txStore.deleteTransaction,
        importTransactions: async (txs: Omit<Transaction, "id" | "created_at" | "updated_at" | "user_id">[]) =>
            await txStore.importTransactions(txs.map(t => ({ ...t, user_id: userId }))),

        // Account mutations
        addAccount: async (acc: Omit<Account, "id" | "created_at" | "updated_at" | "user_id">) =>
            await txStore.addAccount({ ...acc, user_id: userId }),
        updateAccountBalance: txStore.updateAccountBalance,
        deleteAccount: txStore.deleteAccount,

        // Category mutations
        addCategory: async (cat: Omit<Category, "id" | "created_at" | "user_id">) =>
            await txStore.addCategory({ ...cat, user_id: userId }),
        updateCategory: txStore.updateCategory,
        deleteCategory: txStore.deleteCategory,

        // Bucket mutations
        addBucket: (bucket: Omit<Bucket, "id" | "created_at" | "current_amount" | "status" | "user_id">) =>
            bucketStore.addBucket({ ...bucket, user_id: userId }),
        updateBucket: bucketStore.updateBucket,
        deleteBucket: bucketStore.deleteBucket,
        addToBucket: bucketStore.addToBucket,
    };
}
