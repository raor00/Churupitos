import type { Category } from "@/types";

export type CategoryType = "income" | "expense";

export interface CategoryPreset {
    type: CategoryType;
    name: string;
    icon: string;
    color: string;
    groupId?: string;
    groupName?: string;
    groupIcon?: string;
    groupColor?: string;
    order: number;
}

interface ExpenseGroupPreset {
    id: string;
    name: string;
    icon: string;
    color: string;
    items: Array<Pick<CategoryPreset, "name" | "icon" | "color">>;
}

const EXPENSE_GROUPS: ExpenseGroupPreset[] = [
    {
        id: "casa",
        name: "Casa",
        icon: "House",
        color: "#78A8FF",
        items: [
            { name: "Alquiler", icon: "Building2", color: "#78A8FF" },
            { name: "Internet y Teléfono", icon: "Wifi", color: "#78A8FF" },
            { name: "Mantenimiento", icon: "Wrench", color: "#78A8FF" },
        ],
    },
    {
        id: "alimentacion",
        name: "Alimentación",
        icon: "UtensilsCrossed",
        color: "#F48A39",
        items: [
            { name: "Mercado", icon: "ShoppingCart", color: "#F48A39" },
            { name: "Delivery", icon: "Bike", color: "#F48A39" },
            { name: "Comer fuera", icon: "UtensilsCrossed", color: "#F48A39" },
            { name: "Café y Bebidas", icon: "Coffee", color: "#F48A39" },
            { name: "Snacks", icon: "Cookie", color: "#F48A39" },
        ],
    },
    {
        id: "transporte",
        name: "Transporte",
        icon: "Car",
        color: "#8E62FF",
        items: [
            { name: "Gasolina", icon: "Fuel", color: "#8E62FF" },
            { name: "Estacionamiento", icon: "CircleParking", color: "#8E62FF" },
            { name: "Transporte público", icon: "Bus", color: "#8E62FF" },
            { name: "Mantenimiento vehículo", icon: "CarFront", color: "#8E62FF" },
            { name: "Taxis", icon: "Car", color: "#8E62FF" },
        ],
    },
    {
        id: "salud",
        name: "Salud",
        icon: "Heart",
        color: "#EA5A57",
        items: [
            { name: "Seguro Médico", icon: "Shield", color: "#EA5A57" },
            { name: "Consultas", icon: "BriefcaseMedical", color: "#EA5A57" },
            { name: "Farmacia", icon: "Pill", color: "#EA5A57" },
            { name: "Tratamientos", icon: "BadgePlus", color: "#EA5A57" },
        ],
    },
    {
        id: "bienestar",
        name: "Bienestar",
        icon: "Leaf",
        color: "#39C486",
        items: [
            { name: "Actividad Física", icon: "Dumbbell", color: "#39C486" },
            { name: "Belleza", icon: "Sparkles", color: "#39C486" },
            { name: "Aseo Personal", icon: "Hand", color: "#39C486" },
            { name: "Peluquería", icon: "Scissors", color: "#39C486" },
        ],
    },
    {
        id: "vestimenta",
        name: "Vestimenta",
        icon: "Shirt",
        color: "#E35BA8",
        items: [
            { name: "Ropa", icon: "Shirt", color: "#E35BA8" },
            { name: "Zapatos", icon: "Footprints", color: "#E35BA8" },
            { name: "Bolsos", icon: "ShoppingBag", color: "#E35BA8" },
            { name: "Accesorios", icon: "Watch", color: "#E35BA8" },
        ],
    },
    {
        id: "entretenimiento",
        name: "Entretenimiento",
        icon: "Theater",
        color: "#E3BD45",
        items: [
            { name: "Suscripciones", icon: "SquarePlay", color: "#E3BD45" },
            { name: "Eventos y Salidas", icon: "PartyPopper", color: "#E3BD45" },
            { name: "Hobbies", icon: "Palette", color: "#E3BD45" },
            { name: "Videojuegos", icon: "Gamepad2", color: "#E3BD45" },
            { name: "Recreación", icon: "Trees", color: "#E3BD45" },
        ],
    },
];

const INCOME_ITEMS: Array<Pick<CategoryPreset, "name" | "icon" | "color">> = [
    { name: "Salario", icon: "Wallet", color: "#39C486" },
    { name: "Freelance", icon: "Laptop", color: "#4B7CF7" },
    { name: "Inversiones", icon: "TrendingUp", color: "#8E62FF" },
    { name: "Alquileres", icon: "Building2", color: "#F48A39" },
    { name: "Ventas", icon: "Store", color: "#E35BA8" },
    { name: "Otros ingresos", icon: "WalletMinimal", color: "#6D7588" },
];

export const SIN_CATEGORIA = "Sin categoría";

const stripAccents = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

export function categoryIdentity(type: CategoryType, name: string): string {
    return `${type}:${stripAccents(name)}`;
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
    { type: "expense", name: SIN_CATEGORIA, icon: "CircleOff", color: "#6D7588", order: 0 },
    ...EXPENSE_GROUPS.flatMap((group, groupIndex) =>
        group.items.map((item, itemIndex) => ({
            type: "expense" as const,
            name: item.name,
            icon: item.icon,
            color: item.color,
            groupId: group.id,
            groupName: group.name,
            groupIcon: group.icon,
            groupColor: group.color,
            order: (groupIndex + 1) * 100 + itemIndex,
        }))
    ),
    { type: "income", name: SIN_CATEGORIA, icon: "CircleOff", color: "#6D7588", order: 0 },
    ...INCOME_ITEMS.map((item, index) => ({
        type: "income" as const,
        name: item.name,
        icon: item.icon,
        color: item.color,
        order: 100 + index,
    })),
];

const PRESET_BY_ID = new Map(CATEGORY_PRESETS.map((preset) => [categoryIdentity(preset.type, preset.name), preset]));
const EXPENSE_GROUP_ORDER = new Map(EXPENSE_GROUPS.map((group, index) => [group.id, index]));
const LEGACY_DEFAULTS = new Set([
    categoryIdentity("expense", "Comida"),
    categoryIdentity("expense", "Transporte"),
]);

export function getCategoryPreset(type: CategoryType, name: string): CategoryPreset | undefined {
    return PRESET_BY_ID.get(categoryIdentity(type, name));
}

export function getCategoryVisual(category: Pick<Category, "type" | "name" | "icon" | "color">): CategoryPreset {
    const preset = getCategoryPreset(category.type, category.name);
    if (preset) return preset;
    return {
        type: category.type,
        name: category.name,
        icon: category.icon || "Tag",
        color: category.color || "#6D7588",
        order: 9999,
    };
}

export function isLegacyDefaultCategory(category: Pick<Category, "type" | "name" | "is_default">): boolean {
    return Boolean(category.is_default && LEGACY_DEFAULTS.has(categoryIdentity(category.type, category.name)));
}

export function buildDefaultCategorySeed(
    userId: string
): Array<Omit<Category, "id" | "created_at">> {
    return CATEGORY_PRESETS.map((preset) => ({
        user_id: userId,
        name: preset.name,
        icon: preset.icon,
        color: preset.color,
        type: preset.type,
        monthly_budget: undefined,
        is_default: true,
    }));
}

export function sortCategoriesByPreset<T extends Pick<Category, "type" | "name" | "icon" | "color">>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        const pa = getCategoryVisual(a);
        const pb = getCategoryVisual(b);
        if (pa.order !== pb.order) return pa.order - pb.order;
        return a.name.localeCompare(b.name, "es");
    });
}

export interface ExpenseCategorySection<TCategory> {
    id: string;
    name: string;
    icon: string;
    color: string;
    categories: TCategory[];
}

export function groupExpenseCategories<T extends Pick<Category, "type" | "name" | "icon" | "color">>(
    items: T[]
): ExpenseCategorySection<T>[] {
    const sectionMap = new Map<string, ExpenseCategorySection<T>>();

    for (const item of sortCategoriesByPreset(items)) {
        const visual = getCategoryVisual(item);
        const sectionId = visual.groupId ?? "custom";
        const sectionName = visual.groupName ?? "Personalizadas";
        const sectionIcon = visual.groupIcon ?? "Tag";
        const sectionColor = visual.groupColor ?? "#6D7588";

        const section = sectionMap.get(sectionId) ?? {
            id: sectionId,
            name: sectionName,
            icon: sectionIcon,
            color: sectionColor,
            categories: [],
        };

        section.categories.push(item);
        sectionMap.set(sectionId, section);
    }

    return [...sectionMap.values()].sort((a, b) => {
        const oa = EXPENSE_GROUP_ORDER.has(a.id) ? EXPENSE_GROUP_ORDER.get(a.id)! : 999;
        const ob = EXPENSE_GROUP_ORDER.has(b.id) ? EXPENSE_GROUP_ORDER.get(b.id)! : 999;
        if (oa !== ob) return oa - ob;
        return a.name.localeCompare(b.name, "es");
    });
}
