"use client";

import { useEffect } from "react";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";

interface AnimatedCounterProps {
    value: number;
    format?: "currency" | "number";
}

export function AnimatedCounter({ value, format = "number" }: AnimatedCounterProps) {
    const motionValue = useMotionValue(0);
    const rounded = useTransform(motionValue, (latest) => Math.round(latest));

    const display = useTransform(rounded, (latest) => {
        if (format === "currency") {
            return latest.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return latest.toLocaleString("en-US");
    });

    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 1.5,
            ease: "easeOut"
        });

        return controls.stop;
    }, [value, motionValue]);

    return <motion.span>{display}</motion.span>;
}
