import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Mono, Klee_One, Noto_Serif, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const mincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-mincho",
  display: "swap",
});

const receipt = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-receipt",
  display: "swap",
});

const hand = Klee_One({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-hand",
  display: "swap",
});

const symbols = Noto_Serif({
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  variable: "--font-symbols",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forget Me Not — My Trips",
  description: "Travel shopping archive for Forget Me Not",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${mincho.variable} ${receipt.variable} ${hand.variable} ${symbols.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
