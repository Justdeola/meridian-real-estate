export const APP_NAME = "Meridian";
export const APP_TAGLINE = "Find a place you'll love to call home.";
export const APP_DESCRIPTION =
  "Meridian is a private marketplace for distinctive homes, residences, and commercial property across Nigeria.";
export const LISTING_TYPES = [
  { value: "SALE", label: "For Sale" },
  { value: "RENT", label: "For Rent" },
  { value: "SHORT_LET", label: "Short Let" },
  { value: "LEASE", label: "Lease" },
];
export const PROPERTY_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "AVAILABLE",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
  "UNAVAILABLE",
  "ARCHIVED",
  "REJECTED",
];
export const PUBLIC_STATUSES = ["PUBLISHED", "AVAILABLE", "UNDER_OFFER", "SOLD", "RENTED"];
export const LIVE_STATUSES = ["PUBLISHED", "AVAILABLE", "UNDER_OFFER"];
export const APPOINTMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "most_viewed", label: "Most viewed" },
  { value: "most_favorited", label: "Most saved" },
  { value: "recommended", label: "Recommended" },
];
export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
export const BATHROOM_OPTIONS = [1, 2, 3, 4];
export const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Kano", "Calabar"];
export const STATES = ["Lagos", "FCT", "Rivers", "Oyo", "Enugu", "Kano", "Cross River"];
export const CONTACT_METHODS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "WHATSAPP", label: "WhatsApp" },
];
export const ROLES = ["CLIENT", "AGENT", "AGENCY_ADMIN", "ADMIN"];
export const CACHE_TTL = {
  featured: 300,
  listings: 90,
  details: 300,
  search: 60,
  agents: 600,
  agencies: 600,
  categories: 1800,
  popular: 180,
};
export const QUERY_STALE = {
  properties: 60_000,
  property: 120_000,
  categories: 10 * 60_000,
  agents: 10 * 60_000,
  agencies: 10 * 60_000,
  featured: 5 * 60_000,
  me: 30_000,
};
export const DEFAULT_PAGE_SIZE = 12;
export const DEFAULT_NEW_LISTING_DAYS = 14;
export const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b26c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1600&q=80",
];
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=80";
