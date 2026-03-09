"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuth";
import { useTransactionStore } from "@/lib/store/useTransactions";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

const AUTH_PATHS = ["/auth", "/auth/register"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, currentUserId, initDefaultUser } = useAuthStore();
    const { fetchData } = useTransactionStore();
    const router = useRouter();
    const pathname = usePathname();

    const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p));

    // Seed Rafa on very first run
    useEffect(() => {
        initDefaultUser();
    }, [initDefaultUser]);

    useEffect(() => {
        if (!isAuthPath && !isAuthenticated) {
            router.replace("/auth");
        }
    }, [isAuthenticated, isAuthPath, pathname, router]);

    // Fetch user data from Supabase once authenticated
    useEffect(() => {
        if (isAuthenticated && currentUserId) {
            fetchData(currentUserId);
        }
    }, [isAuthenticated, currentUserId, fetchData]);

    // Auth pages: render without app chrome (no header, no bottom nav)
    if (isAuthPath) {
        return <>{children}</>;
    }

    if (!isAuthenticated) return null;

    // App pages: wrap with full chrome
    return (
        <>
            <Header />
            <main className="flex-1 w-full max-w-md mx-auto relative px-4 py-6">
                {children}
            </main>
            <BottomNav />
        </>
    );
}
