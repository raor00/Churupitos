"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const catSchema = z.object({
    name: z.string().min(2, "Nombre muy corto").max(20, "Nombre muy largo"),
    type: z.enum(["income", "expense"]),
    color: z.string(),
    monthly_budget: z.number().optional(),
});

type CatFormValues = z.infer<typeof catSchema>;

const COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16",
    "#22c55e", "#10b981", "#06b6d4", "#3b82f6",
    "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e",
];

export default function NewCategoryPage() {
    const router = useRouter();
    const { addCategory } = useCurrentUser();

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CatFormValues>({
        resolver: zodResolver(catSchema),
        defaultValues: { type: "expense", color: COLORS[0] },
    });

    const catType = watch("type");
    const selectedColor = watch("color");

    const onSubmit = (data: CatFormValues) => {
        addCategory({
            name: data.name,
            type: data.type,
            color: data.color,
            monthly_budget: data.type === "expense" ? data.monthly_budget : undefined,
            icon: "tag",
            is_default: false,
        });
        router.push("/categories");
    };

    return (
        <div className="pb-28 pt-4">
            <header className="flex items-center space-x-4 mb-8">
                <Link href="/categories" className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">Nueva Categoría</h1>
            </header>

            <div className="paper-card p-6 rounded-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm mx-auto">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 rounded-xl">
                        {(["expense", "income"] as const).map((t) => (
                            <label key={t} className={`text-center py-2.5 rounded-lg font-mono text-xs font-bold uppercase cursor-pointer transition-all ${catType === t ? t === "expense" ? "bg-white text-error shadow-sm" : "bg-white text-success shadow-sm" : "text-muted-foreground"}`}>
                                <input type="radio" value={t} {...register("type")} className="hidden" />
                                {t === "expense" ? "Gasto" : "Ingreso"}
                            </label>
                        ))}
                    </div>

                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">Nombre</label>
                        <input {...register("name")} className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary text-xl font-mono p-2 transition-colors outline-none placeholder:text-black/25" placeholder="Ej. Restaurantes" autoComplete="off" />
                        {errors.name && <p className="text-error text-xs font-mono mt-1">{errors.name.message}</p>}
                    </div>

                    {catType === "expense" && (
                        <div>
                            <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">Presupuesto Mensual ($)</label>
                            <input type="number" step="0.01" {...register("monthly_budget", { valueAsNumber: true })} className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary text-xl font-mono p-2 transition-colors outline-none placeholder:text-black/25" placeholder="0.00" />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 block mb-3 tracking-widest">Color</label>
                        <div className="grid grid-cols-6 gap-3">
                            {COLORS.map((c) => (
                                <button key={c} type="button" onClick={() => setValue("color", c)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${selectedColor === c ? "scale-110 shadow-md ring-2 ring-offset-2" : "hover:scale-105 opacity-80"}`} style={{ backgroundColor: c, ...(selectedColor === c ? { ringColor: c } : {}) }}>
                                    {selectedColor === c && <Check className="w-4 h-4 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all mt-4">
                        Guardar Categoría
                    </button>
                </form>
            </div>
        </div>
    );
}
