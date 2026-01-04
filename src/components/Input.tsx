import * as React from "react";

/**
 * An input field with a label and error message
 */
export const Input = React.forwardRef(function Input(
  {
    id,
    label,
    error,
    type = "text",
    wrapperClass,
    ...props
  }: {
    id?: string;
    label: string;
    error?: string | null | undefined;
    type?: string;
    wrapperClass?: string;
    name?: string;
    [key: string]: any;
  },
  ref: React.Ref<HTMLInputElement> | React.Ref<HTMLTextAreaElement>
) {
  const Component = type === "textarea" ? "textarea" : "input";

  return (
    <div className={wrapperClass}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        <Component
          id={id}
          name={props.name || id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-error`}
          className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
          // @ts-ignore - The ref needs to match the input type (HTMLInputElement or HTMLTextAreaElement)
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
