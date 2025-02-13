import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: "hours" | "minutes";
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  onLeftFocus?: () => void;
  onRightFocus?: () => void;
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ className, picker, date, setDate, onLeftFocus, onRightFocus, ...props }, ref) => {
    const [value, setValue] = React.useState<string>(() => {
      if (!date) return "";
      return picker === "hours"
        ? String(date.getHours()).padStart(2, "0")
        : String(date.getMinutes()).padStart(2, "0");
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowRight" && onRightFocus) {
        e.preventDefault();
        onRightFocus();
      }
      if (e.key === "ArrowLeft" && onLeftFocus) {
        e.preventDefault();
        onLeftFocus();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const increment = e.key === "ArrowUp" ? 1 : -1;
        const maxValue = picker === "hours" ? 23 : 59;
        const currentValue = parseInt(value) || 0;
        let newValue = currentValue + increment;
        
        if (newValue > maxValue) newValue = 0;
        if (newValue < 0) newValue = maxValue;

        const newDate = new Date(date || new Date());
        if (picker === "hours") {
          newDate.setHours(newValue);
        } else {
          newDate.setMinutes(newValue);
        }
        setDate(newDate);
        setValue(String(newValue).padStart(2, "0"));
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      if (newValue === "") {
        setValue("");
        return;
      }

      const numericValue = parseInt(newValue.slice(-2));
      const maxValue = picker === "hours" ? 23 : 59;

      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= maxValue) {
        newValue = String(numericValue).padStart(2, "0");
        setValue(newValue);

        const newDate = new Date(date || new Date());
        if (picker === "hours") {
          newDate.setHours(numericValue);
        } else {
          newDate.setMinutes(numericValue);
        }
        setDate(newDate);
      }
    };

    React.useEffect(() => {
      if (!date) {
        setValue("");
        return;
      }

      const newValue =
        picker === "hours"
          ? String(date.getHours()).padStart(2, "0")
          : String(date.getMinutes()).padStart(2, "0");

      setValue(newValue);
    }, [date, picker]);

    return (
      <Input
        {...props}
        ref={ref}
        className={cn(
          "w-[48px] text-center text-base tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={2}
        type="text"
        inputMode="numeric"
      />
    );
  }
);

TimePickerInput.displayName = "TimePickerInput";

export { TimePickerInput };
