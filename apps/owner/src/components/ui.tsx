import Link from "next/link";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "min-h-10 rounded-lg px-3.5 text-sm",
        size === "md" && "min-h-11 rounded-lg px-4 text-sm",
        size === "lg" && "min-h-12 rounded-lg px-5 text-base",
        variant === "primary" && "bg-brand font-black text-slate-900 shadow-brand hover:bg-brand-hover",
        variant === "secondary" && "bg-night text-white hover:bg-night-800",
        variant === "outline" && "border border-border bg-surface text-text hover:bg-bg-subtle",
        variant === "ghost" && "text-text hover:bg-bg-subtle",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
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
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
        size === "sm" && "min-h-10 rounded-lg px-3.5 text-sm",
        size === "md" && "min-h-11 rounded-lg px-4 text-sm",
        size === "lg" && "min-h-12 rounded-lg px-5 text-base",
        variant === "primary" && "bg-brand font-black text-slate-900 shadow-brand hover:bg-brand-hover",
        variant === "secondary" && "bg-night text-white hover:bg-night-800",
        variant === "outline" && "border border-border bg-surface text-text hover:bg-bg-subtle",
        variant === "ghost" && "text-text hover:bg-bg-subtle",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
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
        "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none ring-brand-500 transition placeholder:text-text-muted/70 focus:ring-2",
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
        "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none ring-brand-500 transition focus:ring-2",
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
        "min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none ring-brand-500 transition placeholder:text-text-muted/70 focus:ring-2",
        props.className,
      )}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-400">{children}</label>;
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
  return <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red" | "violet";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tone === "neutral" && "bg-bg-subtle text-text-muted",
        tone === "green" && "bg-success-soft text-success",
        tone === "blue" && "bg-sky-100 text-sky-800",
        tone === "amber" && "bg-warning-soft text-warning",
        tone === "red" && "bg-danger-soft text-danger",
        tone === "violet" && "bg-violet-100 text-violet-800",
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
        "rounded-xl border px-4 py-3 text-sm",
        tone === "neutral" && "border-border bg-surface-muted text-text",
        tone === "success" && "border-success/30 bg-success-soft text-success",
        tone === "warning" && "border-warning/30 bg-warning-soft text-warning",
        tone === "danger" && "border-danger/30 bg-danger-soft text-danger",
      )}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <p>{description}</p>
    </div>
  );
}
