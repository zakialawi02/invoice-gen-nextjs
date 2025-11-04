"use client";

import { forwardRef, useEffect, useMemo, useState } from "react";
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
  locale?: string;
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
      locale: localeProp,
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
    const [detectedLocale, setDetectedLocale] = useState<string>(() => {
      if (typeof document !== "undefined") {
        const documentLang = document.documentElement.lang?.trim();

        if (documentLang) {
          return documentLang;
        }
      }

      if (typeof navigator !== "undefined") {
        const preferredLocale = navigator.language || navigator.languages?.[0];

        if (preferredLocale) {
          return preferredLocale;
        }
      }

      return Intl.NumberFormat().resolvedOptions().locale;
    });

    useEffect(() => {
      const scheduleUpdate =
        typeof queueMicrotask === "function"
          ? queueMicrotask
          : (callback: () => void) => {
              Promise.resolve().then(callback);
            };

      if (typeof document !== "undefined") {
        const documentLang = document.documentElement.lang?.trim();

        if (documentLang) {
          scheduleUpdate(() => {
            setDetectedLocale(documentLang);
          });
          return;
        }
      }

      if (typeof navigator !== "undefined") {
        const preferredLocale = navigator.language || navigator.languages?.[0];

        if (preferredLocale) {
          scheduleUpdate(() => {
            setDetectedLocale(preferredLocale);
          });
        }
      }
    }, []);

    const locale = localeProp ?? detectedLocale;

    const { resolvedThousandSeparator, resolvedDecimalSeparator } = useMemo(() => {
      try {
        const parts = new Intl.NumberFormat(locale).formatToParts(123456.7);
        const group = parts.find((part) => part.type === "group")?.value ?? ",";
        const decimal = parts.find((part) => part.type === "decimal")?.value ?? ".";

        return {
          resolvedThousandSeparator: thousandSeparator ?? group,
          resolvedDecimalSeparator: decimalSeparator ?? decimal,
        };
      } catch {
        return {
          resolvedThousandSeparator: thousandSeparator ?? ",",
          resolvedDecimalSeparator: decimalSeparator ?? ".",
        };
      }
    }, [locale, thousandSeparator, decimalSeparator]);

    return (
      <div className={cn("relative w-full", className)}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          {currencySymbol}
        </span>
        <NumericFormat
          value={value}
          onValueChange={(values) => onValueChange?.(values.floatValue)}
          thousandSeparator={resolvedThousandSeparator}
          decimalSeparator={resolvedDecimalSeparator}
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
