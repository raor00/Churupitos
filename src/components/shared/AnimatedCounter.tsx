"use client";

import { useEffect } from "react";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";

interface AnimatedCounterProps {
    value: number;
    format?: "currency" | "number";
}

export function AnimatedCounter({ value, format = "number" }: AnimatedCounterProps) {
    const motionValue = useMotionValue(0);

    const display = useTransform(motionValue, (latest) => {
        if (format === "currency") {
            return latest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return Math.round(latest).toLocaleString("en-US");
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
