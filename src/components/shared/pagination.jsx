import { Link } from "@tanstack/react-router";
export function Pagination({ meta, search }) {
  if (meta.totalPages <= 1) return null;
  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1).slice(
    Math.max(0, meta.page - 3),
    Math.max(0, meta.page - 3) + 5,
  );
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      {pages.map((p) => (
        <Link
          key={p}
          to="/properties"
          search={{ ...search, page: p }}
          className={
            p === meta.page
              ? "grid size-11 place-items-center rounded-[10px] bg-ink text-accent-fg"
              : "grid size-11 place-items-center rounded-[10px] text-muted hover:bg-ink/5"
          }
        >
          {p}
        </Link>
      ))}
    </div>
  );
}
