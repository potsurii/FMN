const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: "฿",
  JPY: "¥",
  KRW: "₩",
  USD: "$",
  EUR: "€",
  CNY: "¥",
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Format a money amount for display.
 * Does not convert currencies.
 */
export function formatMoney(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
  }).format(amount);

  return `${symbol} ${formatted}`;
}
