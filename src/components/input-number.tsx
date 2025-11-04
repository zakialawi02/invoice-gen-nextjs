import { ChevronDown, ChevronUp } from "lucide-react";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type NumberInputType = Omit<NumericFormatProps, "value" | "onValueChange"> & {
  stepper?: number;
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  value?: number; // Controlled value
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: number | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
  className?: string;
};

export const InputNumber = forwardRef<HTMLInputElement, NumberInputType>(
  (
    {
      stepper = 1,
      thousandSeparator = ",",
      placeholder = "0",
      defaultValue = 0,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      value: controlledValue,
      className,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = useState<number | undefined>(defaultValue);

    // Use controlledValue if provided, otherwise use internal state
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

    const handleIncrement = useCallback(() => {
      const newValue =
        value === undefined ? (stepper ?? 1) : Math.min((value || 0) + (stepper ?? 1), max);

      if (controlledValue !== undefined) {
        // Controlled component
        if (onValueChange) {
          onValueChange(newValue);
        }
      } else {
        // Uncontrolled component
        setUncontrolledValue(newValue);
      }
    }, [stepper, max, value, controlledValue, onValueChange]);

    const handleDecrement = useCallback(() => {
      const newValue =
        value === undefined
          ? min < 0
            ? -(stepper ?? 1)
            : 0
          : Math.max((value || 0) - (stepper ?? 1), min);

      if (controlledValue !== undefined) {
        // Controlled component
        if (onValueChange) {
          onValueChange(newValue);
        }
      } else {
        // Uncontrolled component
        setUncontrolledValue(newValue);
      }
    }, [stepper, min, value, controlledValue, onValueChange]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement === (ref as React.RefObject<HTMLInputElement>)?.current) {
          if (e.key === "ArrowUp") {
            handleIncrement();
          } else if (e.key === "ArrowDown") {
            handleDecrement();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [handleIncrement, handleDecrement, ref]);

    const handleChange = (values: { value: string; floatValue: number | undefined }) => {
      const newValue = values.floatValue === undefined ? undefined : values.floatValue;

      if (controlledValue !== undefined) {
        // Controlled component
        if (onValueChange) {
          onValueChange(newValue);
        }
      } else {
        // Uncontrolled component
        setUncontrolledValue(newValue);
      }
    };

    const handleBlur = () => {
      if (value !== undefined) {
        let newValue = value;
        if (value < min) {
          newValue = min;
        } else if (value > max) {
          newValue = max;
        }

        if (newValue !== value) {
          if (controlledValue !== undefined) {
            // Controlled component
            if (onValueChange) {
              onValueChange(newValue);
            }
          } else {
            // Uncontrolled component
            setUncontrolledValue(newValue);
          }
        }
      }
    };

    return (
      <div className={`${className} flex items-center`}>
        <NumericFormat
          value={value}
          onValueChange={handleChange}
          thousandSeparator={thousandSeparator}
          decimalScale={decimalScale}
          fixedDecimalScale={fixedDecimalScale}
          allowNegative={min < 0}
          valueIsNumericString
          onBlur={handleBlur}
          max={max}
          min={min}
          suffix={suffix}
          prefix={prefix}
          customInput={Input}
          placeholder={placeholder}
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none relative"
          getInputRef={ref}
          {...props}
        />

        <div className="flex flex-col z-10 inset-y-0 -ml-6">
          <Button
            type="button"
            aria-label="Increase value"
            className="px-2 h-4 w-5 rounded-l-none rounded-br-none border-input border-l-0 border-b-[0.5px] focus-visible:relative"
            variant="outline"
            onClick={handleIncrement}
            disabled={value !== undefined && value >= max}
          >
            <ChevronUp size={12} />
          </Button>
          <Button
            type="button"
            aria-label="Decrease value"
            className="px-2 h-4 w-5 rounded-l-none rounded-tr-none border-input border-l-0 border-t-[0.5px] focus-visible:relative"
            variant="outline"
            onClick={handleDecrement}
            disabled={value !== undefined && value <= min}
          >
            <ChevronDown size={12} />
          </Button>
        </div>
      </div>
    );
  },
);

InputNumber.displayName = "InputNumber";
