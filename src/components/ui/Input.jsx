// src/components/ui/Input.jsx
import React, { forwardRef, useState, useCallback } from "react";
import clsx from "clsx";
import { formatInputNumber, parseInputNumber } from "../../utils/formatters";

const baseClass = clsx(
  "w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3",
  "text-gray-100 placeholder-gray-500 text-sm font-arabic",
  "transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand-600/50 focus:border-brand-600"
);

// ── Plain text / date / select input ──────────────────────────────────────────
export const Input = forwardRef(({ label, error, hint, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-gray-400 tracking-wide">{label}</label>}
    <input
      ref={ref}
      className={clsx(baseClass, error && "border-red-500 focus:ring-red-500/50", className)}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
    {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
));
Input.displayName = "Input";

// ── Currency / number input WITH auto-formatting ───────────────────────────────
/**
 * Use this instead of <Input type="number"> for money / quantity fields.
 * Displays commas every 3 digits as user types.
 * Passes the raw numeric string to react-hook-form via onChange.
 *
 * Compatible with react-hook-form register() — spread it normally.
 */
export const NumberInput = forwardRef(({
  label, error, hint, className,
  value,
  onChange,
  onBlur,
  ...props
}, ref) => {
  // Keep a display value with commas; keep raw value clean for RHF
  const [display, setDisplay] = useState(() => formatInputNumber(value ?? ""));

  const handleChange = useCallback((e) => {
    const raw      = parseInputNumber(e.target.value);
    const formatted = formatInputNumber(raw);
    setDisplay(formatted);
    // Synthesise a fake event with the raw (numeric-string) value
    if (onChange) {
      onChange({ ...e, target: { ...e.target, value: raw } });
    }
  }, [onChange]);

  // Sync external value changes (e.g. form reset)
  React.useEffect(() => {
    setDisplay(formatInputNumber(value ?? ""));
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-400 tracking-wide">{label}</label>}
      <input
        ref={ref}
        inputMode="decimal"
        autoComplete="off"
        className={clsx(baseClass, error && "border-red-500 focus:ring-red-500/50", className)}
        value={display}
        onChange={handleChange}
        onBlur={onBlur}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
});
NumberInput.displayName = "NumberInput";

// ── Select ────────────────────────────────────────────────────────────────────
export const Select = forwardRef(({ label, error, children, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-gray-400 tracking-wide">{label}</label>}
    <select
      ref={ref}
      className={clsx(
        baseClass,
        "cursor-pointer appearance-none [&>option]:bg-gray-900",
        error && "border-red-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Select.displayName = "Select";

// ── Textarea ──────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-semibold text-gray-400 tracking-wide">{label}</label>}
    <textarea
      ref={ref}
      className={clsx(baseClass, "resize-y min-h-[80px]", error && "border-red-500", className)}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Textarea.displayName = "Textarea";

export default Input;
