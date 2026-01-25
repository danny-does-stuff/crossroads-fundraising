import { Link } from "@tanstack/react-router";
import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  linkTo?: string;
  className?: string;
  variant?: "primary" | "selected" | "custom";
}

/**
 * A button component that can optionally act as a link
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { children, linkTo, className, variant = "primary", ...props },
    ref,
  ) {
    const baseClasses = "rounded py-2 px-4";
    const variantClasses = {
      primary: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-400",
      selected: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-500",
      custom: "", // allows full customization through className
    };

    const classes = `${baseClasses} ${
      variant === "custom" ? "" : variantClasses[variant]
    } ${className || ""}`;

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
  },
);
