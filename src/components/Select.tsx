import type { HTMLProps } from "react";
import { forwardRef } from "react";
import { Input } from "./Input";

interface SelectProps extends Omit<
  HTMLProps<HTMLSelectElement>,
  "ref" | "label"
> {
  id: string;
  label: string;
  error: string | null | undefined;
  children: React.ReactNode;
  defaultDisplayValue?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { id, label, error, children, readOnly, defaultDisplayValue, ...props },
    _ref
  ) {
    if (readOnly) {
      return (
        <>
          <Input
            id={`${id}-display`}
            label={label}
            error={error}
            readOnly={readOnly}
            value={
              defaultDisplayValue ||
              String(props.value || props.defaultValue || "")
            }
          />
          <input
            type="hidden"
            name={id}
            value={props.value || props.defaultValue}
          />
        </>
      );
    }

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="mt-1">
          <select
            id={id}
            name={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-error`}
            className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
            {...props}
          >
            {children}
          </select>
          {error && (
            <div className="pt-1 text-red-700" id={`${id}-error`}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
);
