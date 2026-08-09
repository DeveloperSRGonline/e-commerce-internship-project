"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface CartContextType {
  cartCount: number;
  isBouncing: boolean;
  refreshCartCount: () => Promise<void>;
  triggerBounce: () => void;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  isBouncing: false,
  refreshCartCount: async () => {},
  triggerBounce: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);

  const refreshCartCount = useCallback(async () => {
    if (!session?.user) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success && data.data?.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalItems = data.data.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(totalItems);
      }
    } catch {
      // Ignore errors
    }
  }, [session]);

  const triggerBounce = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 600);
  }, []);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, isBouncing, refreshCartCount, triggerBounce }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
