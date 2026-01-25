import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  label: string;
  error?: string | null;
  type?: string;
  wrapperClass?: string;
  name?: string;
}

/**
 * An input field with a label and error message
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { id, label, error, type = "text", wrapperClass, ...props },
    ref,
  ) {
    const isTextarea = type === "textarea";

    return (
      <div className={wrapperClass}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="mt-1">
          {isTextarea ?
            <textarea
              id={id}
              name={props.name || id}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-error`}
              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              // @ts-expect-error - Input supports text area refs too
              ref={ref}
              {...props}
            />
          : <input
              id={id}
              name={props.name || id}
              type={type}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-error`}
              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              ref={ref}
              {...props}
            />
          }
          {error && (
            <div className="pt-1 text-red-700" id={`${id}-error`}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  },
);
