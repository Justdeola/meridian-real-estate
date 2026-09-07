import { cn } from "@/lib/utils";
export function Badge({ children, tone = "ink", className }) {
  const tones = {
    ink: "bg-ink text-accent-fg",
    accent: "bg-accent text-accent-fg",
    muted: "bg-ink/8 text-ink",
    good: "bg-accent/12 text-accent",
    warn: "bg-danger/10 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
