const memory = new Map();
function redisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}
async function redisFetch(path, body) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(`${url}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) return null;
  return await res.json();
}
export async function cacheGet(key) {
  try {
    if (redisConfigured()) {
      const data = await redisFetch(`/get/${encodeURIComponent(key)}`);
      const raw = data?.result;
      if (typeof raw !== "string") return null;
      return JSON.parse(raw);
    }
    const hit = memory.get(key);
    if (!hit) return null;
    if (hit.expires < Date.now()) {
      memory.delete(key);
      return null;
    }
    return JSON.parse(hit.value);
  } catch {
    return null;
  }
}
export async function cacheSet(key, value, ttlSeconds) {
  const payload = JSON.stringify(value);
  try {
    if (redisConfigured()) {
      await redisFetch("/set", [key, payload, "EX", ttlSeconds]);
      return;
    }
    memory.set(key, { value: payload, expires: Date.now() + ttlSeconds * 1000 });
  } catch {
    /* cache is best-effort */
  }
}
export async function cacheDel(key) {
  try {
    if (redisConfigured()) {
      await redisFetch("/del", [key]);
      return;
    }
    memory.delete(key);
  } catch {
    /* ignore */
  }
}
export async function cacheDelPrefix(prefix) {
  try {
    if (redisConfigured()) {
      const data = await redisFetch("/keys", [`${prefix}*`]);
      const keys = Array.isArray(data?.result) ? data.result : [];
      if (keys.length) await redisFetch("/del", keys);
      return;
    }
    for (const key of [...memory.keys()]) {
      if (key.startsWith(prefix)) memory.delete(key);
    }
  } catch {
    /* ignore */
  }
}
export const cacheKeys = {
  featured: "properties:featured",
  popular: "properties:popular",
  newListings: "properties:new",
  types: "catalog:types",
  amenities: "catalog:amenities",
  settings: "catalog:settings",
  property: (idOrSlug) => `property:${idOrSlug}`,
  list: (hash) => `properties:list:${hash}`,
  search: (hash) => `properties:search:${hash}`,
  agent: (idOrSlug) => `agent:${idOrSlug}`,
  agents: "agents:list",
  agency: (idOrSlug) => `agency:${idOrSlug}`,
  agencies: "agencies:list",
  agentProperties: (agentId) => `agent:${agentId}:properties`,
};
export async function invalidatePropertiesCache() {
  await Promise.all([
    cacheDelPrefix("properties:"),
    cacheDelPrefix("property:"),
    cacheDelPrefix("agent:"),
    cacheDel(cacheKeys.featured),
    cacheDel(cacheKeys.popular),
    cacheDel(cacheKeys.newListings),
  ]);
}
export async function invalidatePropertyCache(id, slug) {
  await Promise.all([
    cacheDel(cacheKeys.property(id)),
    slug ? cacheDel(cacheKeys.property(slug)) : Promise.resolve(),
    cacheDelPrefix("properties:"),
    cacheDel(cacheKeys.featured),
    cacheDel(cacheKeys.popular),
    cacheDel(cacheKeys.newListings),
  ]);
}
export async function invalidateAgentsCache() {
  await Promise.all([cacheDelPrefix("agent:"), cacheDel(cacheKeys.agents)]);
}
export async function invalidateAgenciesCache() {
  await Promise.all([cacheDelPrefix("agency:"), cacheDel(cacheKeys.agencies)]);
}
export async function invalidateCatalogCache() {
  await Promise.all([
    cacheDel(cacheKeys.types),
    cacheDel(cacheKeys.amenities),
    cacheDel(cacheKeys.settings),
  ]);
}
export function normalizeCacheKey(parts) {
  const entries = Object.entries(parts)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${String(v)}`).join("&");
}
