import type { Metadata } from "next";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Churupitos",
  description: "Personal finance, typewritten.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col relative pb-24">
        <Header />
        <main className="flex-1 w-full max-w-md mx-auto relative px-4 py-6">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
