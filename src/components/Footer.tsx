import Link from "next/link";
import { Logo } from "@/components/Logo";

const footerLinks = {
  Plateforme: [
    { href: "/audios", label: "Audios" },
    { href: "/experts", label: "Experts" },
    { href: "/dashboard", label: "Dashboard" },
  ],
  Compte: [
    { href: "/login", label: "Connexion" },
    { href: "/register", label: "Inscription" },
    { href: "/dashboard/submit", label: "Envoyer aux experts" },
  ],
};

export function Footer() {
  return (
    <footer className="isolate border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Logo size="lg" linked={false} />
            <p className="mt-3 max-w-xs text-sm text-muted leading-relaxed antialiased">
              Production musicale africaine — connectez artistes, beatmakers
              et experts musicaux.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="text-sm font-semibold uppercase tracking-wider text-gold">
                {title}
              </p>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} LBP Records. Tous droits réservés.</p>
          <p>Paiements sécurisés via Fedapay</p>
        </div>
      </div>
    </footer>
  );
}
