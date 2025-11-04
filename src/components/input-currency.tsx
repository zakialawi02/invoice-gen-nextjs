"use client";

import { forwardRef } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";

type InputCurrencyProps = {
  currency?: string;
  value?: number;
  onValueChange?: (value: number | undefined) => void;
  className?: string;
  inputClassName?: string;
  thousandSeparator?: NumericFormatProps["thousandSeparator"];
  decimalSeparator?: NumericFormatProps["decimalSeparator"];
} & Omit<
  NumericFormatProps,
  | "value"
  | "onValueChange"
  | "customInput"
  | "thousandSeparator"
  | "decimalSeparator"
  | "prefix"
  | "suffix"
>;

const InputCurrency = forwardRef<HTMLInputElement, InputCurrencyProps>(
  (
    {
      currency = "USD",
      value,
      onValueChange,
      className,
      inputClassName,
      thousandSeparator,
      decimalSeparator,
      decimalScale = 2,
      fixedDecimalScale = true,
      allowNegative = false,
      ...props
    },
    ref,
  ) => {
    const currencySymbol = getCurrencySymbol(currency);

    return (
      <div className={cn("relative w-full", className)}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          {currencySymbol}
        </span>
        <NumericFormat
          value={value}
          onValueChange={(values) => onValueChange?.(values.floatValue)}
          thousandSeparator={thousandSeparator ?? ","}
          decimalSeparator={decimalSeparator ?? "."}
          decimalScale={decimalScale}
          fixedDecimalScale={fixedDecimalScale}
          allowNegative={allowNegative}
          getInputRef={ref}
          customInput={Input}
          className={cn(
            "pl-8 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            inputClassName,
          )}
          {...props}
        />
      </div>
    );
  },
);

InputCurrency.displayName = "InputCurrency";

export default InputCurrency;
