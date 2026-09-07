import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { toggleFav } from "@/lib/server/me";
import { cn } from "@/lib/utils";
export function FavoriteButton({ propertyId, favorited }) {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const [on, setOn] = useState(favorited);
  const mutation = useMutation({
    mutationFn: () => toggleFav({ data: { propertyId } }),
    onMutate: () => {
      setOn((v) => !v);
    },
    onError: () => {
      setOn((v) => !v);
      toast.error("Could not update saved properties.");
    },
    onSuccess: (res) => {
      setOn(res.favorited);
      void qc.invalidateQueries({ queryKey: ["favorites"] });
      void qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
  return (
    <button
      type="button"
      aria-label={on ? "Remove from saved" : "Save property"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          toast.message("Sign in to save properties.");
          return;
        }
        mutation.mutate();
      }}
      className={cn(
        "grid size-11 place-items-center rounded-full bg-surface/95 text-ink shadow-[var(--shadow-border)] transition-transform duration-150 active:scale-[0.96]",
        on && "text-danger",
      )}
    >
      <Heart className={cn("size-4", on && "fill-current")} />
    </button>
  );
}
