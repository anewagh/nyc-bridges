import type { Metadata } from "next";
import { Montserrat, Libre_Baskerville } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Bridge Walks",
  description: "Track your goal of walking every major bridge, city by city",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${libreBaskerville.variable} antialiased`}
      >
        <header className="border-b border-[var(--card-border)]">
          <nav className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-serif text-lg font-bold tracking-tight">
              Bridge Walks
            </Link>
            <span className="text-sm text-[var(--muted)]">2026</span>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
