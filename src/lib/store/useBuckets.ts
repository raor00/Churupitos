import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Bucket {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    description: string;
    target_amount: number;
    target_currency: "VES" | "USD" | "USDT" | "EUR";
    current_amount: number;
    deadline?: string;
    status: "active" | "completed" | "paused";
    created_at: string;
}

interface BucketState {
    _allBuckets: Bucket[];
    getBuckets: (userId: string) => Bucket[];
    addBucket: (bucket: Omit<Bucket, "id" | "created_at" | "current_amount" | "status">) => void;
    updateBucket: (id: string, updates: Partial<Bucket>) => void;
    deleteBucket: (id: string) => void;
    addToBucket: (id: string, amount: number) => void;
}

export const useBucketStore = create<BucketState>()(
    persist(
        (set, get) => ({
            _allBuckets: [
                {
                    id: "b1",
                    user_id: "__demo__",
                    name: "Emergency Fund",
                    icon: "shield",
                    description: "6 months of living expenses",
                    target_amount: 5000,
                    target_currency: "USD",
                    current_amount: 1500,
                    status: "active",
                    created_at: new Date().toISOString(),
                },
                {
                    id: "b2",
                    user_id: "__demo__",
                    name: "New Laptop",
                    icon: "laptop",
                    description: "Macbook Pro M3",
                    target_amount: 2000,
                    target_currency: "USD",
                    current_amount: 1850,
                    deadline: "2026-06-01",
                    status: "active",
                    created_at: new Date().toISOString(),
                },
            ],

            getBuckets: (userId) =>
                get()._allBuckets.filter(b => b.user_id === userId),

            addBucket: (bucket) => set((state) => ({
                _allBuckets: [
                    ...state._allBuckets,
                    {
                        ...bucket,
                        id: crypto.randomUUID(),
                        current_amount: 0,
                        status: "active",
                        created_at: new Date().toISOString(),
                    },
                ],
            })),

            updateBucket: (id, updates) => set((state) => ({
                _allBuckets: state._allBuckets.map(b => b.id === id ? { ...b, ...updates } : b),
            })),

            deleteBucket: (id) => set((state) => ({
                _allBuckets: state._allBuckets.filter(b => b.id !== id),
            })),

            addToBucket: (id, amount) => set((state) => ({
                _allBuckets: state._allBuckets.map(b => {
                    if (b.id !== id) return b;
                    const newAmount = b.current_amount + amount;
                    return {
                        ...b,
                        current_amount: newAmount,
                        status: newAmount >= b.target_amount ? "completed" : b.status,
                    };
                }),
            })),
        }),
        { name: "churupitos-buckets" }
    )
);
