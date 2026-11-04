"use client";

import { ButtonHTMLAttributes, CSSProperties, forwardRef } from "react";

type Variant = "primary" | "ghost" | "danger" | "lane";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantInlineStyles: Record<Variant, CSSProperties> = {
  primary: { background: "var(--accent)", color: "var(--accent-ink)" },
  ghost: { background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-primary)" },
  danger: { background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)" },
  lane: { background: "var(--text-primary)", color: "var(--bg-surface)", letterSpacing: "0.08em" },
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[12px]",
  md: "px-5 py-2.5 text-[14px]",
  lg: "px-6 py-3 text-[16px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, className = "", style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center gap-2",
          "font-semibold tracking-[0.03em] uppercase transition-all duration-150 active:scale-[0.98]",
          "cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
          sizeStyles[size],
          className,
        ].join(" ")}
        style={{ borderRadius: "2px", ...variantInlineStyles[variant], ...style }}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
