import { Link } from "@remix-run/react";
import * as React from "react";

/**
 * A button component
 */
export const Button = React.forwardRef(function Button(
  {
    children,
    linkTo,
    ...props
  }: {
    children: React.ReactNode;
    linkTo?: string;
    [key: string]: any;
  },
  ref: React.Ref<HTMLButtonElement>
) {
  const classes =
    "rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400";
  if (linkTo) {
    return (
      <Link to={linkTo} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});
