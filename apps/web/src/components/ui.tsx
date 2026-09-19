import Link from "next/link";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonSizes = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-6 text-base",
};

const buttonVariants = {
  primary: "bg-pitch text-white hover:bg-pitch-dark",
  secondary: "bg-pitch-dark text-white hover:bg-pitch-deep",
  outline: "border border-border bg-white text-text hover:border-pitch",
  ghost: "text-text hover:bg-pitch-light",
  danger: "bg-red-700 text-white hover:bg-red-800",
  lime: "bg-gold text-pitch-deep hover:bg-lime-dim",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] font-bold tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        buttonSizes[size],
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[12px] font-bold tracking-tight transition-colors",
        buttonSizes[size],
        buttonVariants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-brand border border-border bg-white px-3 text-sm text-text outline-none transition placeholder:text-text-muted/70 focus:border-night",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-12 w-full rounded-brand border border-border bg-white px-3 text-sm text-text outline-none transition focus:border-night",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-brand border border-border bg-white px-3 py-2 text-sm text-text outline-none transition placeholder:text-text-muted/70 focus:border-night",
        props.className,
      )}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">{children}</label>;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-small">{hint}</p>}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-brand border border-border bg-white p-5", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red" | "violet" | "lime";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide",
        tone === "neutral" && "bg-bg-subtle text-text-muted",
        tone === "green" && "bg-pitch-light text-pitch",
        tone === "lime" && "bg-gold-soft text-pitch-dark",
        tone === "blue" && "bg-pitch-dark text-white",
        tone === "amber" && "bg-warning-soft text-warning",
        tone === "red" && "bg-danger-soft text-danger",
        tone === "violet" && "bg-sport-soft text-sport",
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  title,
  description,
  tone = "neutral",
}: {
  title?: string;
  description: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-brand border px-4 py-3 text-sm",
        tone === "neutral" && "border-border bg-surface-muted text-text",
        tone === "success" && "border-lime bg-lime/20 text-night",
        tone === "warning" && "border-warning/30 bg-warning-soft text-warning",
        tone === "danger" && "border-danger/30 bg-danger-soft text-danger",
      )}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <p>{description}</p>
    </div>
  );
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="inline-flex rounded-[12px] bg-pitch-light p-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={cn(
            "rounded-[10px] px-3 py-2 text-sm font-bold transition",
            value === item.key ? "bg-pitch text-white" : "text-pitch hover:text-pitch-dark",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
