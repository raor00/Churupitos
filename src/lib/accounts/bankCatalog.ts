import { Landmark, Globe } from "lucide-react";

export type BankScope = "national" | "international";

export interface BankCatalogItem {
    id: string;
    name: string;
    scope: BankScope;
    supportedCurrencies: Array<"VES" | "USD" | "USDT" | "EUR">;
    brandColor: string;
    defaultIcon: string;
    defaultLogoUrl?: string;
}

export interface AccountIconOption {
    id: string;
    label: string;
    icon: string;
}

const logoFromDomain = (domain: string) => `https://logo.clearbit.com/${domain}`;

export const BANK_CATALOG: BankCatalogItem[] = [
    {
        id: "banesco",
        name: "Banesco",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#00693C",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("banesco.com"),
    },
    {
        id: "mercantil",
        name: "Mercantil",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#004B87",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("mercantilbanco.com"),
    },
    {
        id: "provincial",
        name: "Provincial",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#0A4DA2",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("bbvaprovincial.com.ve"),
    },
    {
        id: "venezuela",
        name: "Banco de Venezuela",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#F1C40F",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("bdv.com.ve"),
    },
    {
        id: "bnc",
        name: "BNC",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#F58220",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("bnc.com.ve"),
    },
    {
        id: "bancamiga",
        name: "Bancamiga",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#2BB673",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("bancamiga.com"),
    },
    {
        id: "bancaribe",
        name: "Bancaribe",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#E53935",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("bancaribe.com.ve"),
    },
    {
        id: "exterior",
        name: "Banco Exterior",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#0070B8",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("bancoexterior.com"),
    },
    {
        id: "plaza",
        name: "Banco Plaza",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#7B1E3B",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("bancoplaza.com"),
    },
    {
        id: "fondo-comun",
        name: "Fondo Común",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#0050A0",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("fondocomun.com.ve"),
    },
    {
        id: "sofitasa",
        name: "Sofitasa",
        scope: "national",
        supportedCurrencies: ["VES"],
        brandColor: "#00887A",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("sofitasa.com"),
    },
    {
        id: "binance",
        name: "Binance",
        scope: "international",
        supportedCurrencies: ["USD", "USDT"],
        brandColor: "#F3BA2F",
        defaultIcon: "Wallet",
        defaultLogoUrl: logoFromDomain("binance.com"),
    },
    {
        id: "zelle",
        name: "Zelle",
        scope: "international",
        supportedCurrencies: ["USD"],
        brandColor: "#6D1ED4",
        defaultIcon: "Send",
        defaultLogoUrl: logoFromDomain("zellepay.com"),
    },
    {
        id: "zinli",
        name: "Zinli",
        scope: "international",
        supportedCurrencies: ["USD"],
        brandColor: "#E01F4E",
        defaultIcon: "CreditCard",
        defaultLogoUrl: logoFromDomain("zinli.com"),
    },
    {
        id: "paypal",
        name: "PayPal",
        scope: "international",
        supportedCurrencies: ["USD", "EUR"],
        brandColor: "#003087",
        defaultIcon: "Wallet",
        defaultLogoUrl: logoFromDomain("paypal.com"),
    },
    {
        id: "wise",
        name: "Wise",
        scope: "international",
        supportedCurrencies: ["USD", "EUR"],
        brandColor: "#9FE870",
        defaultIcon: "Globe",
        defaultLogoUrl: logoFromDomain("wise.com"),
    },
    {
        id: "airtm",
        name: "Airtm",
        scope: "international",
        supportedCurrencies: ["USD", "USDT"],
        brandColor: "#00B388",
        defaultIcon: "Wallet",
        defaultLogoUrl: logoFromDomain("airtm.com"),
    },
    {
        id: "facebank",
        name: "Facebank",
        scope: "international",
        supportedCurrencies: ["USD"],
        brandColor: "#00569D",
        defaultIcon: "Building2",
        defaultLogoUrl: logoFromDomain("facebank.pr"),
    },
    {
        id: "bank-of-america",
        name: "Bank of America",
        scope: "international",
        supportedCurrencies: ["USD"],
        brandColor: "#D4001A",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("bankofamerica.com"),
    },
    {
        id: "chase",
        name: "Chase",
        scope: "international",
        supportedCurrencies: ["USD"],
        brandColor: "#117ACA",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("chase.com"),
    },
    {
        id: "wells-fargo",
        name: "Wells Fargo",
        scope: "international",
        supportedCurrencies: ["USD"],
        brandColor: "#B31B1B",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("wellsfargo.com"),
    },
    {
        id: "td",
        name: "TD",
        scope: "international",
        supportedCurrencies: ["USD"],
        brandColor: "#00B140",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("td.com"),
    },
    {
        id: "capital-one",
        name: "Capital One",
        scope: "international",
        supportedCurrencies: ["USD"],
        brandColor: "#004879",
        defaultIcon: "Landmark",
        defaultLogoUrl: logoFromDomain("capitalone.com"),
    },
];

export const ACCOUNT_ICON_OPTIONS: AccountIconOption[] = [
    { id: "Landmark", label: "Banco", icon: "Landmark" },
    { id: "Wallet", label: "Wallet", icon: "Wallet" },
    { id: "CreditCard", label: "Tarjeta", icon: "CreditCard" },
    { id: "Send", label: "Transferencia", icon: "Send" },
    { id: "Smartphone", label: "Pago movil", icon: "Smartphone" },
    { id: "PiggyBank", label: "Ahorro", icon: "PiggyBank" },
    { id: "Building2", label: "Empresa", icon: "Building2" },
    { id: "Globe", label: "Global", icon: "Globe" },
];

export const ACCOUNT_SCOPE_OPTIONS: Array<{
    id: BankScope;
    label: string;
    description: string;
    icon: typeof Landmark;
}> = [
    {
        id: "national",
        label: "Nacional",
        description: "Cuenta bancaria en bolivares.",
        icon: Landmark,
    },
    {
        id: "international",
        label: "Internacional",
        description: "Banco, wallet o proveedor en dolares.",
        icon: Globe,
    },
];

export function getBanksByScope(scope: BankScope) {
    return BANK_CATALOG.filter((item) => item.scope === scope);
}

export function getBankById(bankId?: string | null) {
    if (!bankId) return undefined;
    return BANK_CATALOG.find((item) => item.id === bankId);
}
