import Link from "next/link";
import { Button } from "@/components/Button";
import type { Expert, ExpertService } from "@/types/expert";

type ExpertCardProps = {
  expert: Expert;
  showCta?: boolean;
};

function formatPrice(service: ExpertService) {
  if (service.on_quote || service.price_fcfa === null) {
    return "Sur devis";
  }
  return new Intl.NumberFormat("fr-FR").format(service.price_fcfa) + " FCFA";
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;

  return (
    <div className="flex items-center gap-1" aria-label={`Note ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < full
              ? "text-gold"
              : i === full && hasHalf
                ? "text-gold/60"
                : "text-border"
          }
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-sm text-muted">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ExpertCard({ expert, showCta = true }: ExpertCardProps) {
  const initials = expert.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-gold/30">
      <div className="flex gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-elevated text-xl font-bold text-gold">
          {expert.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={expert.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">{expert.display_name}</h3>
              <p className="text-sm text-gold">{expert.specialty}</p>
              {expert.city && (
                <p className="mt-0.5 text-sm text-muted">{expert.city}</p>
              )}
            </div>
            <StarRating rating={Number(expert.rating)} />
          </div>

          {expert.bio && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {expert.bio}
            </p>
          )}

          {expert.services.length > 0 && (
            <ul className="mt-4 space-y-2">
              {expert.services.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface-elevated px-3 py-2 text-sm"
                >
                  <span>{service.name}</span>
                  <span className="shrink-0 font-medium text-gold">
                    {formatPrice(service)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {showCta && (
            <div className="mt-5">
              <Button href="/dashboard/submit" variant="secondary">
                Envoyer ma maquette
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ExpertFilters({
  specialties,
  active,
}: {
  specialties: string[];
  active?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterLink href="/experts" label="Tous" active={!active} />
      {specialties.map((specialty) => (
        <FilterLink
          key={specialty}
          href={`/experts?specialty=${encodeURIComponent(specialty)}`}
          label={specialty}
          active={active === specialty}
        />
      ))}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
        active
          ? "bg-gold text-black font-medium"
          : "border border-border text-muted hover:border-gold/40 hover:text-gold"
      }`}
    >
      {label}
    </Link>
  );
}
