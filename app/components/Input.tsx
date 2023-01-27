import * as React from "react";

/**
 * An input field with a label and error message
 */
export const Input = React.forwardRef(function Input(
  {
    id,
    label,
    error,
    ...props
  }: {
    id: string;
    label: string;
    error: string | null | undefined;
    [key: string]: any;
  },
  _ref: React.Ref<HTMLInputElement>
) {
  const localRef = React.useRef<HTMLInputElement>(null);
  const ref = _ref || localRef;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        <input
          id={id}
          name={id}
          type="text"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-error`}
          className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
          ref={ref}
          {...props}
        />
        {error && (
          <div className="pt-1 text-red-700" id={`${id}-error`}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
});
