import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/cart/CartContext";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ShopIN — Curated Tech & Lifestyle Essentials",
  description: "Discover engineered products, high-grade electronics, and lifestyle goods. Fast dispatch across India with Razorpay protection.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} h-full dark antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-[#a1a1aa]">
        <SessionProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
