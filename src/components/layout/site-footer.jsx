import { Link } from "@tanstack/react-router";
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-ink text-accent-fg">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl tracking-[0.18em]">MERIDIAN</p>
          <p className="mt-3 max-w-md text-sm text-accent-fg/70">
            A considered marketplace for homes, residences and commercial property across Nigeria.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-accent-fg/50">Explore</p>
          <Link to="/properties" search={{ listingType: "SALE" }} className="text-accent-fg/80 hover:text-accent-fg">For sale</Link>
          <Link to="/properties" search={{ listingType: "RENT" }} className="text-accent-fg/80 hover:text-accent-fg">To rent</Link>
          <Link to="/agents" className="text-accent-fg/80 hover:text-accent-fg">Agents</Link>
          <Link to="/agencies" className="text-accent-fg/80 hover:text-accent-fg">Agencies</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-accent-fg/50">Practice</p>
          <Link to="/login" className="text-accent-fg/80 hover:text-accent-fg">Client access</Link>
          <Link to="/dashboard/agent" className="text-accent-fg/80 hover:text-accent-fg">List a property</Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-accent-fg/50">
        Meridian Estates · Private listings · Lagos · Abuja
      </div>
    </footer>
  );
}
