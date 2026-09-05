export function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-line px-6 py-16 text-center">
      <h3 className="font-display text-2xl">{title}</h3>
      {body ? <p className="max-w-md text-sm text-muted">{body}</p> : null}
      {action}
    </div>
  );
}
