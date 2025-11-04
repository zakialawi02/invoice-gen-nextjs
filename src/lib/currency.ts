const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
  INR: "₹",
  SGD: "$",
  IDR: "Rp",
};

export function getCurrencySymbol(currencyCode: string): string {
  return currencySymbols[currencyCode] || currencyCode || "$";
}
