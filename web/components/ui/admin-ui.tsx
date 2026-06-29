import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'glass-panel rounded-[18px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] motion-safe md:p-8',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-moment-muted)]"
    >
      {children}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-[14px] border border-[color:var(--color-moment-border-strong)] bg-[color:var(--color-moment-bg-secondary)] px-4 py-3 text-sm text-[color:var(--color-moment-text)] placeholder:text-[color:var(--color-moment-muted)] motion-safe focus:border-[color:var(--color-moment-accent)] focus:outline-none focus:ring-1 focus:ring-[rgba(245,233,211,0.25)]',
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full appearance-none rounded-[14px] border border-[color:var(--color-moment-border-strong)] bg-[color:var(--color-moment-bg-secondary)] px-4 py-3 text-sm text-[color:var(--color-moment-text)] motion-safe focus:border-[color:var(--color-moment-accent)] focus:outline-none focus:ring-1 focus:ring-[rgba(245,233,211,0.25)]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Button({
  className,
  variant = 'primary',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'danger';
}) {
  const variants = {
    primary:
      'bg-[color:var(--color-moment-accent)] text-[color:var(--color-moment-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:brightness-105',
    secondary:
      'border border-[color:var(--color-moment-border-strong)] bg-[color:var(--color-moment-glass)] text-[color:var(--color-moment-text)] hover:bg-[rgba(255,255,255,0.1)]',
    success:
      'bg-[color:var(--color-moment-success)] text-[color:var(--color-moment-bg)] shadow-[0_12px_40px_rgba(83,215,105,0.15)] hover:brightness-105',
    ghost:
      'bg-transparent text-[color:var(--color-moment-text-secondary)] hover:bg-[rgba(255,255,255,0.05)]',
    danger:
      'border border-[rgba(255,92,92,0.35)] bg-[rgba(255,92,92,0.1)] text-[color:var(--color-moment-danger)] hover:bg-[rgba(255,92,92,0.16)]',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[14px] px-6 py-2.5 text-sm font-semibold motion-safe hover:-translate-y-px active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gradient">{title}</h1>
      {description && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--color-moment-text-secondary)]">
          {description}
        </p>
      )}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-moment-muted)]">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-[color:var(--color-moment-border-strong)]">/</span>}
          {item.href ? (
            <a
              href={item.href}
              className="motion-safe hover:text-[color:var(--color-moment-accent)]"
            >
              {item.label}
            </a>
          ) : (
            <span className="font-medium text-[color:var(--color-moment-text-secondary)]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[14px] border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-card)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-moment-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-[color:var(--color-moment-text)]">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-[color:var(--color-moment-muted)]">{hint}</p>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[14px] border border-[color:var(--color-moment-border)] bg-[color:var(--color-moment-card)]',
        className
      )}
    />
  );
}
