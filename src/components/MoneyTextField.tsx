import { TextField } from "@mui/material";
import type { ChangeEvent } from "react";
import type { TextFieldProps } from "@mui/material";

type MoneyTextFieldProps = Omit<TextFieldProps, "type" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  allowNegative?: boolean;
};

function normalizeMoneyInput(value: string, allowNegative: boolean) {
  const trimmed = value.trim();
  const negative = allowNegative && trimmed.startsWith("-");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return negative ? "-" : "";
  return `${negative ? "-" : ""}${digits}`;
}

function formatMoneyInput(value: string) {
  if (!value || value === "-") return value;
  const negative = value.startsWith("-");
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return negative ? "-" : "";
  const formatted = Number(digits).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return `${negative ? "-" : ""}${formatted}`;
}

export default function MoneyTextField({
  value,
  onChange,
  allowNegative = false,
  slotProps,
  ...props
}: MoneyTextFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(normalizeMoneyInput(event.target.value, allowNegative));
  };

  return (
    <TextField
      {...props}
      value={formatMoneyInput(value)}
      onChange={handleChange}
      slotProps={{
        ...slotProps,
        input: {
          inputMode: "numeric",
          ...slotProps?.input,
        },
      }}
    />
  );
}
