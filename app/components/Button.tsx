import * as React from "react";

/**
 * A button component
 */
export const Button = React.forwardRef(function Button(
  {
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: any;
  },
  ref: React.Ref<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
      {...props}
    >
      {children}
    </button>
  );
});
