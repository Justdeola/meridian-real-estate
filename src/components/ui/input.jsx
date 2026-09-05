import { cn } from "@/lib/utils";
export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-sm text-ink placeholder:text-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
      {...props}
    />
  );
}
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[12px] border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
      {...props}
    />
  );
}
export function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
