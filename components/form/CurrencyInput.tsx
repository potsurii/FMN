import { Input } from "@/components/foundation/Input";
import { Select, type SelectOption } from "@/components/form/Select";

const DEFAULT_CURRENCIES: SelectOption[] = [
  { value: "THB", label: "THB" },
  { value: "JPY", label: "JPY" },
  { value: "KRW", label: "KRW" },
  { value: "USD", label: "USD" },
  { value: "CNY", label: "CNY" },
  { value: "EUR", label: "EUR" },
];

type CurrencyInputProps = {
  amount: string;
  currency: string;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  amountId?: string;
  currencyId?: string;
  hasError?: boolean;
  currencies?: SelectOption[];
  disabled?: boolean;
};

export function CurrencyInput({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  amountId,
  currencyId,
  hasError = false,
  currencies = DEFAULT_CURRENCIES,
  disabled = false,
}: CurrencyInputProps) {
  return (
    <div className="flex gap-2">
      <div className="w-[7.5rem] shrink-0">
        <Select
          id={currencyId}
          options={currencies}
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          hasError={hasError}
          disabled={disabled}
          aria-label="Currency"
        />
      </div>
      <Input
        id={amountId}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        hasError={hasError}
        disabled={disabled}
        placeholder="0"
        aria-label="Amount"
      />
    </div>
  );
}
