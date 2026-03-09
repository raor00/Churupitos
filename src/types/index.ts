export interface Transaction {
    id: string;
    user_id: string;
    type: "income" | "expense";
    description: string;
    amount: number;
    currency: "VES" | "USD" | "USDT" | "EUR";
    amount_ves: number;
    rate_used: number;
    rate_type: "bcv" | "usdt" | "manual";
    category_id: string;
    account_id?: string;
    bucket_id?: string;
    date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    color: string;
    type: "income" | "expense";
    monthly_budget?: number;
    is_default: boolean;
    created_at: string;
}

export interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    default_currency: "VES" | "USD" | "USDT" | "EUR";
    preferred_rate: "bcv" | "usdt";
    created_at: string;
}

export interface Account {
    id: string;
    user_id: string;
    name: string;
    currency: "VES" | "USD" | "USDT" | "EUR";
    balance: number;
    created_at: string;
    updated_at: string;
}
