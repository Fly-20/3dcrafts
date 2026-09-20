"use client";

import { useCallback, useSyncExternalStore } from "react";

export type CartLine = {
  variantId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  unitPricePence: number;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  discountCode: string;
  giftCardCode: string;
};

const STORAGE_KEY = "3dcrafts_cart";
const CODES_STORAGE_KEY = "3dcrafts_cart_codes";
const SERVER_SNAPSHOT: CartState = { lines: [], discountCode: "", giftCardCode: "" };

let state: CartState = SERVER_SNAPSHOT;
let loadedFromStorage = false;
const listeners = new Set<() => void>();

/** Cart state lives outside React (module-level) and is synced via `useSyncExternalStore` — the standard way to read/write an external system (localStorage) without triggering `set-state-in-effect`. */
function loadState(): CartState {
  if (loadedFromStorage) return state;
  loadedFromStorage = true;
  try {
    const rawLines = window.localStorage.getItem(STORAGE_KEY);
    const rawCodes = window.localStorage.getItem(CODES_STORAGE_KEY);
    const codes = rawCodes ? JSON.parse(rawCodes) : {};
    state = {
      lines: rawLines ? JSON.parse(rawLines) : [],
      discountCode: codes.discountCode ?? "",
      giftCardCode: codes.giftCardCode ?? "",
    };
  } catch {
    // corrupt/unavailable storage — start with an empty cart
  }
  return state;
}

function persist() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
  window.localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify({ discountCode: state.discountCode, giftCardCode: state.giftCardCode }));
}

function setState(updater: (current: CartState) => CartState) {
  state = updater(state);
  persist();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return loadState();
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addLine = useCallback((line: Omit<CartLine, "quantity">, quantity: number) => {
    setState((prev) => {
      const existing = prev.lines.find((item) => item.variantId === line.variantId);
      const lines = existing
        ? prev.lines.map((item) => (item.variantId === line.variantId ? { ...item, quantity: item.quantity + quantity } : item))
        : [...prev.lines, { ...line, quantity }];
      return { ...prev, lines };
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      lines: quantity <= 0 ? prev.lines.filter((item) => item.variantId !== variantId) : prev.lines.map((item) => (item.variantId === variantId ? { ...item, quantity } : item)),
    }));
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setState((prev) => ({ ...prev, lines: prev.lines.filter((item) => item.variantId !== variantId) }));
  }, []);

  const clear = useCallback(() => {
    setState(() => ({ lines: [], discountCode: "", giftCardCode: "" }));
  }, []);

  const setDiscountCode = useCallback((discountCode: string) => {
    setState((prev) => ({ ...prev, discountCode }));
  }, []);

  const setGiftCardCode = useCallback((giftCardCode: string) => {
    setState((prev) => ({ ...prev, giftCardCode }));
  }, []);

  const itemCount = current.lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    lines: current.lines,
    itemCount,
    addLine,
    setQuantity,
    removeLine,
    clear,
    discountCode: current.discountCode,
    setDiscountCode,
    giftCardCode: current.giftCardCode,
    setGiftCardCode,
  };
}
