const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
  INR: "₹",
  SGD: "S$",
  IDR: "Rp",
};

export function getCurrencySymbol(currencyCode: string): string {
  const upperCaseCode = currencyCode.toUpperCase();
  return currencySymbols[upperCaseCode] || upperCaseCode || "$";
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formattedAmount}`;
}
