import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/foundation/Input";

type DatePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  hasError?: boolean;
};

export function DatePicker({ hasError, className = "", ...props }: DatePickerProps) {
  return (
    <Input
      type="date"
      hasError={hasError}
      className={className}
      {...props}
    />
  );
}
