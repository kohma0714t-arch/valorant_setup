import type { ReactNode } from "react";
import { AlertTriangle, Database, SearchX } from "lucide-react";

type Variant = "empty" | "error" | "setup";

const ICONS = { empty: SearchX, error: AlertTriangle, setup: Database };

export function StateMessage({
  variant = "empty",
  title,
  children,
  action,
  className = "",
}: {
  variant?: Variant;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = ICONS[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`tick-corners hatch flex flex-col items-center justify-center gap-3 border border-line px-6 py-12 text-center ${className}`}
    >
      <span
        className={`grid size-11 place-items-center border ${
          variant === "error" ? "border-accent text-accent" : "border-line-strong text-muted"
        } bg-bg`}
      >
        <Icon size={20} strokeWidth={1.6} />
      </span>
      <p className="font-display text-lg font-semibold tracking-[0.06em]">{title}</p>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Supabase 未設定時の案内 */
export function SetupNotice({ className = "" }: { className?: string }) {
  return (
    <StateMessage variant="setup" title="SUPABASE が未設定です" className={className}>
      <p>
        <code className="font-mono text-fg">.env.local</code> に{" "}
        <code className="font-mono text-fg">NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
        <code className="font-mono text-fg">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        を設定し、<code className="font-mono text-fg">supabase/migrations</code> と{" "}
        <code className="font-mono text-fg">seed.sql</code> を適用してください。手順は README を参照。
      </p>
    </StateMessage>
  );
}
