import { HTMLAttributes } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  noPadding?: boolean;
  laneStyle?: boolean;
}

export default function Panel({
  elevated,
  noPadding,
  laneStyle,
  children,
  className = "",
  style,
  ...props
}: PanelProps) {
  return (
    <div
      className={["rounded-none relative", noPadding ? "" : "p-5 md:p-6", className].join(" ")}
      style={{
        background: elevated ? "var(--bg-elevated)" : "var(--bg-surface)",
        border: laneStyle ? "2px solid var(--accent)" : "1px solid var(--border-subtle)",
        boxShadow: laneStyle ? "4px 4px 0px 0px var(--accent)" : "none",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
