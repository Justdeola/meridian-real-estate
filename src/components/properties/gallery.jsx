import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
export function PropertyGallery({ images, title }) {
  const pics = images.length ? images : [];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  if (!pics.length) return <div className="aspect-[16/10] rounded-[24px] bg-ink/10" />;
  const current = pics[index] ?? pics[0];
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-4">
        <button
          type="button"
          className="relative overflow-hidden rounded-[24px] lg:col-span-3"
          onClick={() => setOpen(true)}
        >
          <img
            src={current.url}
            alt={current.alt ?? title}
            className="aspect-[16/10] w-full object-cover"
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs text-accent-fg">
            {index + 1} / {pics.length}
          </span>
        </button>
        <div className="hidden grid-rows-3 gap-3 lg:grid">
          {pics.slice(0, 3).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn("overflow-hidden rounded-[16px]", i === index && "ring-2 ring-accent")}
            >
              <img src={img.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4">
          <button
            type="button"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-surface text-ink"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            className="absolute left-4 grid size-11 place-items-center rounded-full bg-surface"
            onClick={() => setIndex((i) => (i - 1 + pics.length) % pics.length)}
            aria-label="Previous"
          >
            <ChevronLeft />
          </button>
          <img src={current.url} alt={title} className="max-h-[86vh] max-w-full object-contain" />
          <button
            type="button"
            className="absolute right-4 grid size-11 place-items-center rounded-full bg-surface"
            onClick={() => setIndex((i) => (i + 1) % pics.length)}
            aria-label="Next"
          >
            <ChevronRight />
          </button>
        </div>
      ) : null}
    </>
  );
}
