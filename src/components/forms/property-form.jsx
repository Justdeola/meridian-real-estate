import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { LISTING_TYPES, STOCK_IMAGES } from "@/lib/constants";
import { fetchCatalog } from "@/lib/server/catalog";
import { saveProperty } from "@/lib/server/properties";
import { cn } from "@/lib/utils";
export function PropertyForm({ existing }) {
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => fetchCatalog() });
  const navigate = useNavigate();
  const [images, setImages] = useState(existing?.images.map((i) => i.url) ?? []);
  const [url, setUrl] = useState("");
  const [amenitySlugs, setAmenitySlugs] = useState(existing?.amenities.map((a) => a.slug) ?? []);
  const mutation = useMutation({
    mutationFn: (form) =>
      saveProperty({
        data: {
          id: existing?.id,
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          listingType: String(form.get("listingType") ?? "SALE"),
          propertyTypeSlug: String(form.get("propertyTypeSlug") ?? "house"),
          price: Number(form.get("price")),
          bedrooms: num(form.get("bedrooms")),
          bathrooms: num(form.get("bathrooms")),
          toilets: num(form.get("toilets")),
          parking: num(form.get("parking")),
          sizeSqm: num(form.get("sizeSqm")),
          landSizeSqm: num(form.get("landSizeSqm")),
          yearBuilt: num(form.get("yearBuilt")),
          address: String(form.get("address") ?? ""),
          area: String(form.get("area") ?? ""),
          city: String(form.get("city") ?? ""),
          state: String(form.get("state") ?? ""),
          amenitySlugs,
          images: images.map((u, i) => ({ url: u, isPrimary: i === 0 })),
          status: String(form.get("status") ?? "PENDING_REVIEW"),
        },
      }),
    onSuccess: (res) => {
      toast.success(existing ? "Listing updated." : "Listing submitted for review.");
      void navigate({ to: "/dashboard/agent" });
      return res;
    },
    onError: (err) => toast.error(err.message),
  });
  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(new FormData(e.currentTarget));
      }}
    >
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Title</Label>
          <Input name="title" required defaultValue={existing?.title} />
        </div>
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea name="description" required defaultValue={existing?.description} />
        </div>
        <div>
          <Label>Listing type</Label>
          <select
            name="listingType"
            defaultValue={existing?.listingType}
            className="h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-sm"
          >
            {LISTING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Property type</Label>
          <select
            name="propertyTypeSlug"
            defaultValue={existing?.propertyTypeSlug}
            className="h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-sm"
          >
            {catalog.data?.types.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Price (₦)</Label>
          <Input name="price" type="number" required defaultValue={existing?.price} />
        </div>
        <div>
          <Label>Status</Label>
          <select
            name="status"
            defaultValue={existing?.status ?? "PENDING_REVIEW"}
            className="h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Submit for review</option>
          </select>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["bedrooms", "Bedrooms", existing?.bedrooms],
          ["bathrooms", "Bathrooms", existing?.bathrooms],
          ["toilets", "Toilets", existing?.toilets],
          ["parking", "Parking", existing?.parking],
          ["sizeSqm", "Size sqm", existing?.sizeSqm],
          ["landSizeSqm", "Land sqm", existing?.landSizeSqm],
          ["yearBuilt", "Year built", existing?.yearBuilt],
        ].map(([name, label, val]) => (
          <div key={String(name)}>
            <Label>{String(label)}</Label>
            <Input name={String(name)} type="number" defaultValue={val ?? ""} />
          </div>
        ))}
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Address</Label>
          <Input name="address" defaultValue={existing?.address ?? ""} />
        </div>
        <div>
          <Label>Area</Label>
          <Input name="area" defaultValue={existing?.area ?? ""} />
        </div>
        <div>
          <Label>City</Label>
          <Input name="city" defaultValue={existing?.city ?? ""} />
        </div>
        <div>
          <Label>State</Label>
          <Input name="state" defaultValue={existing?.state ?? ""} />
        </div>
      </section>
      <section>
        <Label>Features</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {catalog.data?.amenities.map((a) => {
            const on = amenitySlugs.includes(a.slug);
            return (
              <button
                key={a.slug}
                type="button"
                onClick={() =>
                  setAmenitySlugs((s) => (on ? s.filter((x) => x !== a.slug) : [...s, a.slug]))
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs",
                  on ? "bg-ink text-accent-fg" : "bg-bg text-muted",
                )}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <Label>Images</Label>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              className="relative overflow-hidden rounded-[12px]"
              onClick={() => setImages((arr) => arr.filter((_, idx) => idx !== i))}
            >
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Image URL" />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!url) return;
              setImages((arr) => [...arr, url]);
              setUrl("");
            }}
          >
            Add URL
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">Or choose a stock photograph</p>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {STOCK_IMAGES.slice(0, 12).map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setImages((arr) => (arr.includes(src) ? arr : [...arr, src]))}
              className="overflow-hidden rounded-[10px]"
            >
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      </section>
      <Button type="submit" loading={mutation.isPending}>
        {existing ? "Save listing" : "Submit listing"}
      </Button>
    </form>
  );
}
function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
