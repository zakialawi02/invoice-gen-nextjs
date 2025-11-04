"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";

type InputCurrencyProps = React.ComponentPropsWithoutRef<typeof Input> & {
  currency?: string;
  className?: string;
};

export default function InputCurrency({
  currency = "USD",
  className,
  ...props
}: InputCurrencyProps) {
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-muted-foreground text-sm font-medium">{currencySymbol}</span>
        </div>
        <Input className="pl-8 w-full" {...props} type="number" step="1" min="0" />
      </div>
    </div>
  );
}
