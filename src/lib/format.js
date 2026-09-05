import { LISTING_TYPES } from "./constants";
export function formatPrice(amount, currency = "NGN") {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "Price on request";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₦${Math.round(n).toLocaleString("en-NG")}`;
  }
}
export function formatPriceWithTenure(amount, listingType, currency = "NGN") {
  const base = formatPrice(amount, currency);
  if (listingType === "RENT") return `${base} / year`;
  if (listingType === "SHORT_LET") return `${base} / night`;
  if (listingType === "LEASE") return `${base} / year`;
  return base;
}
export function listingTypeLabel(value) {
  return LISTING_TYPES.find((t) => t.value === value)?.label ?? value;
}
export function formatNumber(n) {
  return new Intl.NumberFormat("en-NG").format(n);
}
export function formatSize(sqm) {
  if (sqm == null || sqm === "") return null;
  const n = Number(sqm);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${formatNumber(n)} sqm`;
}
export function formatLocation(parts) {
  return parts.filter(Boolean).join(", ");
}
export function statusLabel(status) {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
export function compactNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
export function relativeTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
