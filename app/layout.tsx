import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const mincho = localFont({
  src: [
    { path: "./fonts/ShipporiMincho-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ShipporiMincho-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ShipporiMincho-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/ShipporiMincho-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-mincho",
  display: "swap",
});

const receipt = localFont({
  src: [
    { path: "./fonts/DMMono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/DMMono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-receipt",
  display: "swap",
});

const hand = localFont({
  src: [
    { path: "./fonts/KleeOne-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/KleeOne-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-hand",
  display: "swap",
});

const symbols = localFont({
  src: [
    { path: "./fonts/NotoSerif-500.woff2", weight: "500", style: "normal" },
  ],
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