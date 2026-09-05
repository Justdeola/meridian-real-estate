import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { AppShell } from "@/components/layout/app-shell";
import { PropertyGrid } from "@/components/properties/property-card";
import { HeroSearch } from "@/components/search/hero-search";
import { PropertyCardSkeleton } from "@/components/ui/skeleton";
import { APP_TAGLINE, HERO_IMAGE, QUERY_STALE } from "@/lib/constants";
import { fetchHomeData } from "@/lib/server/properties";
export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [{ title: "Meridian · Find a place you'll love to call home" }],
  }),
});
function Home() {
  const home = useQuery({
    queryKey: ["home"],
    queryFn: () => fetchHomeData(),
    staleTime: QUERY_STALE.featured,
  });
  return (
    <AppShell>
      <section className="relative min-h-[78vh] overflow-hidden">
        <img src={HERO_IMAGE} alt="A considered family house at dusk" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/35 to-ink/20" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end gap-8 px-4 pb-16 pt-28 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl text-accent-fg">
            <p className="text-xs uppercase tracking-[0.22em] text-accent-fg/70">Private listings · Nigeria</p>
            <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">{APP_TAGLINE}</h1>
            <p className="mt-4 max-w-lg text-base text-accent-fg/80">Distinctive homes, residences and commercial property — presented with the care of a private practice.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }} className="max-w-4xl">
            <HeroSearch />
          </motion.div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Header kicker="Featured" title="Residences currently in view" to="/properties" search={{ featured: true }} />
        {home.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <PropertyGrid items={home.data?.featured ?? []} />
        )}
      </section>
      <section className="bg-ink py-20 text-accent-fg">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-3">
          {[
            ["01", "Exact particulars", "Measured photography, verified title notes, and agents who have walked the rooms."],
            ["02", "Private viewings", "Request a time. The listing agent confirms, reschedules, or completes the appointment in one place."],
            ["03", "A quiet market", "Saved searches, considered filters, and listings that do not shout."],
          ].map(([n, t, b]) => (
            <div key={n}>
              <p className="text-xs tracking-[0.18em] text-accent-fg/50">{n}</p>
              <h3 className="mt-3 font-display text-3xl">{t}</h3>
              <p className="mt-3 text-sm text-accent-fg/70">{b}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Header kicker="Just arrived" title="New to the book" to="/properties" search={{ newListing: true, sort: "newest" }} />
        <PropertyGrid items={home.data?.newest ?? []} />
      </section>
    </AppShell>
  );
}
function Header({ kicker, title, to, search }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{kicker}</p>
        <h2 className="mt-2 font-display text-4xl sm:text-5xl">{title}</h2>
      </div>
      <Link to={to} search={search} className="hidden items-center gap-1 text-sm text-muted hover:text-ink sm:inline-flex">
        View all <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
