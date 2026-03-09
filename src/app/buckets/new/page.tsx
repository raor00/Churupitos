"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const bucketSchema = z.object({
    name: z.string().min(3, "Nombre muy corto"),
    description: z.string().min(3, "Descripción muy corta"),
    target_amount: z.number().positive("El monto debe ser positivo"),
    target_currency: z.enum(["USD", "VES", "EUR", "USDT"]),
    deadline: z.string().optional(),
});

type BucketFormValues = z.infer<typeof bucketSchema>;

export default function NewBucketPage() {
    const router = useRouter();
    const { addBucket } = useCurrentUser();

    const { register, handleSubmit, watch, formState: { errors } } = useForm<BucketFormValues>({
        resolver: zodResolver(bucketSchema),
        defaultValues: { target_currency: "USD" },
    });

    const onSubmit = (data: BucketFormValues) => {
        addBucket({
            name: data.name,
            description: data.description,
            target_amount: data.target_amount,
            target_currency: data.target_currency,
            icon: "target",
            deadline: data.deadline || undefined,
        });
        router.push("/buckets");
    };

    return (
        <div className="pb-safe pt-4">
            <header className="flex items-center space-x-4 mb-8">
                <Link href="/buckets" className="p-2 border border-black/10 rounded-full hover:bg-black/5 bg-white/50 backdrop-blur-sm transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-mono font-bold uppercase tracking-tighter">Nueva Meta</h1>
            </header>

            <div className="paper-card p-6 rounded-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm mx-auto">
                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">Nombre</label>
                        <input {...register("name")} className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono text-xl p-2 transition-colors outline-none placeholder:text-black/25" placeholder="Ej. Viaje a la playa" />
                        {errors.name && <p className="text-error text-xs font-mono mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">Descripción</label>
                        <input {...register("description")} className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono p-2 transition-colors outline-none placeholder:text-black/25" placeholder="Para diciembre 2026..." />
                        {errors.description && <p className="text-error text-xs font-mono mt-1">{errors.description.message}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">Monto Objetivo</label>
                        <div className="flex items-end gap-3">
                            <input type="number" step="0.01" {...register("target_amount", { valueAsNumber: true })} className="flex-1 bg-transparent border-b-2 border-black/20 focus:border-primary text-3xl font-mono p-2 transition-colors outline-none placeholder:text-black/25" placeholder="0.00" />
                            <div className="flex gap-1 pb-2">
                                {["USD", "VES", "EUR", "USDT"].map((curr) => (
                                    <label key={curr} className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all whitespace-nowrap ${watch("target_currency") === curr ? "bg-foreground text-background font-bold" : "bg-black/5 text-muted-foreground hover:bg-black/10"}`}>
                                        <input type="radio" value={curr} {...register("target_currency")} className="hidden" />
                                        {curr}
                                    </label>
                                ))}
                            </div>
                        </div>
                        {errors.target_amount && <p className="text-error text-xs font-mono mt-1">{errors.target_amount.message}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] font-mono uppercase text-muted-foreground ml-1 tracking-widest">Fecha Límite (Opcional)</label>
                        <input type="date" {...register("deadline")} className="w-full bg-transparent border-b-2 border-black/20 focus:border-primary font-mono p-2 transition-colors outline-none" />
                    </div>
                    <button type="submit" className="w-full bg-primary text-primary-foreground font-mono font-bold uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all mt-4">
                        Crear Meta
                    </button>
                </form>
            </div>
        </div>
    );
}
