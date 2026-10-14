import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { FmnTag } from "@/components/ui/fmn-tag";
import { cn } from "@/lib/utils";

type TicketOption = {
  value: string;
  label: string;
};

type TicketFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

const controlClass =
  "w-full border-0 border-b border-dashed bg-transparent px-0.5 py-1 font-mono text-[0.82rem] text-ink outline-none placeholder:text-ink/40 focus:border-solid focus:bg-vermilion/10";

export function TicketField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
}: TicketFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor}>
        <FmnTag>
          {label}
          {required ? " *" : ""}
        </FmnTag>
      </label>
      {children}
      {hint && !error ? (
        <p className="font-mono text-[0.68rem] tracking-wide text-ink/60">{hint}</p>
      ) : null}
      {error ? (
        <p className="font-mono text-[0.68rem] tracking-wide text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

export function TicketInput({
  hasError = false,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className={cn(
        controlClass,
        hasError ? "border-red-600" : "border-vermilion",
        className,
      )}
      {...props}
    />
  );
}

export function TicketDatePicker({
  hasError,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { hasError?: boolean }) {
  return (
    <TicketInput
      type="date"
      hasError={hasError}
      className={cn("[color-scheme:light]", className)}
      {...props}
    />
  );
}

export function TicketSelect({
  options,
  hasError = false,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  options: TicketOption[];
  hasError?: boolean;
}) {
  return (
    <select
      className={cn(
        controlClass,
        hasError ? "border-red-600" : "border-vermilion",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
