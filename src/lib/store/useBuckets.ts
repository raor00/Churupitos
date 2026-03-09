import { create } from "zustand";

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
    buckets: Bucket[];
}

export const useBucketStore = create<BucketState>((set) => ({
    buckets: [
        {
            id: "1",
            user_id: "user1",
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
            id: "2",
            user_id: "user1",
            name: "New Laptop",
            icon: "laptop",
            description: "Macbook Pro M3",
            target_amount: 2000,
            target_currency: "USD",
            current_amount: 1850,
            deadline: "2026-06-01",
            status: "active",
            created_at: new Date().toISOString(),
        }
    ],
}));
