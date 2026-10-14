import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type FmnInputProps = InputHTMLAttributes<HTMLInputElement>;

export function FmnInput({ className, ...props }: FmnInputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-none border-0 border-b border-dashed border-vermilion bg-transparent px-0.5 py-1 font-mono text-[0.82rem] text-ink outline-none placeholder:text-ink/40 focus:border-solid focus:bg-vermilion/10",
        className,
      )}
      {...props}
    />
  );
}
