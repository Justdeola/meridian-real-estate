import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITIES, LISTING_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
export function HeroSearch() {
  const navigate = useNavigate();
  const [listingType, setListingType] = useState("SALE");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [propertyType, setPropertyType] = useState("");
  return (
    <form
      className="w-full rounded-[24px] bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void navigate({
          to: "/properties",
          search: {
            listingType,
            city: city || undefined,
            q: q || undefined,
            propertyType: propertyType || undefined,
          },
        });
      }}
    >
      <div className="mb-3 flex gap-1 rounded-[14px] bg-bg p-1">
        {LISTING_TYPES.slice(0, 3).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setListingType(t.value)}
            className={cn(
              "flex-1 rounded-[10px] px-3 py-2 text-sm transition-colors",
              listingType === t.value ? "bg-ink text-accent-fg" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="Area, city or keyword"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="h-11 rounded-[10px] border border-line bg-surface px-3 text-sm"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="h-11 rounded-[10px] border border-line bg-surface px-3 text-sm"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          <option value="">Any type</option>
          <option value="apartment">Apartment</option>
          <option value="duplex">Duplex</option>
          <option value="villa">Villa</option>
          <option value="penthouse">Penthouse</option>
          <option value="house">House</option>
          <option value="bungalow">Bungalow</option>
          <option value="office">Office</option>
          <option value="land">Land</option>
        </select>
        <Button type="submit" size="lg" className="w-full">
          <Search className="size-4" />
          Search
        </Button>
      </div>
    </form>
  );
}
