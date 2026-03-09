import type { Account } from "@/types";

const META_PREFIX = "__account_meta__:";

type StoredAccountMeta = {
    bank_id?: string;
    logo_url?: string;
    display_icon?: string;
    account_scope?: "national" | "international";
};

export function serializeAccountForDb(
    account: Omit<Account, "id" | "created_at" | "updated_at">
) {
    const meta: StoredAccountMeta = {
        bank_id: account.bank_id,
        logo_url: account.logo_url,
        display_icon: account.display_icon || account.icon,
        account_scope: account.account_scope ?? (account.currency === "VES" ? "national" : "international"),
    };

    return {
        user_id: account.user_id,
        name: account.name,
        provider: account.provider,
        color: account.color,
        currency: account.currency,
        balance: account.balance,
        icon: `${META_PREFIX}${JSON.stringify(meta)}`,
    };
}

export function deserializeAccountFromDb(account: Account): Account {
    const rawIcon = account.icon ?? "";
    if (!rawIcon.startsWith(META_PREFIX)) {
        return {
            ...account,
            display_icon: account.display_icon ?? account.icon,
            account_scope: account.account_scope ?? (account.currency === "VES" ? "national" : "international"),
        };
    }

    try {
        const parsed = JSON.parse(rawIcon.slice(META_PREFIX.length)) as StoredAccountMeta;
        return {
            ...account,
            icon: parsed.display_icon ?? "Wallet",
            display_icon: parsed.display_icon ?? "Wallet",
            bank_id: parsed.bank_id,
            logo_url: parsed.logo_url,
            account_scope: parsed.account_scope ?? (account.currency === "VES" ? "national" : "international"),
        };
    } catch {
        return {
            ...account,
            account_scope: account.account_scope ?? (account.currency === "VES" ? "national" : "international"),
        };
    }
}
