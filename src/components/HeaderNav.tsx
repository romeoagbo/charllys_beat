"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";
import type { UserRole } from "@/types/profile";

export type HeaderUser = {
  email: string | undefined;
  displayName: string | null;
  role: UserRole;
};

type NavLink = { href: string; label: string };

function getNavForUser(user: HeaderUser | null): NavLink[] {
  const publicLinks: NavLink[] = [
    { href: "/audios", label: "Audios" },
    { href: "/experts", label: "Experts" },
    { href: "/#categories", label: "Catégories" },
  ];

  if (!user) return publicLinks;

  if (user.role === "admin") {
    return [
      { href: "/dashboard/admin", label: "Administration" },
      { href: "/dashboard/admin/manage", label: "Utilisateurs" },
      { href: "/audios", label: "Catalogue" },
      { href: "/experts", label: "Experts" },
      { href: "/dashboard/upload", label: "Publier" },
    ];
  }

  if (user.role === "expert") {
    return [
      { href: "/dashboard", label: "Mon espace" },
      { href: "/audios", label: "Audios" },
      { href: "/experts", label: "Experts" },
    ];
  }

  return [
    { href: "/dashboard", label: "Mon espace" },
    { href: "/audios", label: "Audios" },
    { href: "/experts", label: "Experts" },
    { href: "/dashboard/submit", label: "Envoyer aux experts" },
  ];
}

function AuthActions({
  user,
  onNavigate,
  className = "",
}: {
  user: HeaderUser | null;
  onNavigate?: () => void;
  className?: string;
}) {
  if (!user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Button href="/login" variant="ghost">
          Connexion
        </Button>
        <Button href="/register" variant="secondary">
          S&apos;inscrire
        </Button>
      </div>
    );
  }

  const dashboardHref =
    user.role === "admin" ? "/dashboard/admin" : "/dashboard";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Link
        href={dashboardHref}
        onClick={onNavigate}
        className="hidden max-w-[140px] truncate text-sm text-muted transition-colors hover:text-gold sm:block"
        title={user.email}
      >
        {user.displayName ?? user.email}
      </Link>
      <SignOutButton />
    </div>
  );
}

type HeaderNavProps = {
  user: HeaderUser | null;
};

export function HeaderNav({ user }: HeaderNavProps) {
  const [open, setOpen] = useState(false);
  const navLinks = getNavForUser(user);
  const close = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
        <Logo size="md" />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex">
          <AuthActions user={user} />
        </div>

        <button
          type="button"
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-foreground" />
          <span className="block h-0.5 w-6 bg-foreground" />
          <span className="block h-0.5 w-6 bg-foreground" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-surface md:hidden"
          >
            <nav className="flex flex-col gap-4 px-6 py-6">
              {user && (
                <p className="text-sm text-gold">
                  {user.displayName ?? user.email}
                  <span className="ml-2 text-xs uppercase text-muted">
                    {user.role === "admin"
                      ? "Admin"
                      : user.role === "expert"
                        ? "Expert"
                        : "Artiste"}
                  </span>
                </p>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted hover:text-gold"
                  onClick={close}
                >
                  {link.label}
                </Link>
              ))}
              <AuthActions
                user={user}
                onNavigate={close}
                className="flex-col items-stretch pt-2"
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
