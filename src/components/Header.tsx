"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";

const navLinks = [
  { href: "/audios", label: "Audios" },
  { href: "/experts", label: "Experts" },
  { href: "/#categories", label: "Catégories" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="gold-gradient">Charllys</span>
        </Link>

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

        <div className="hidden items-center gap-3 md:flex">
          <Button href="/login" variant="ghost">
            Connexion
          </Button>
          <Button href="/register" variant="secondary">
            S&apos;inscrire
          </Button>
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
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted hover:text-gold"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-2">
                <Button href="/login" variant="ghost">
                  Connexion
                </Button>
                <Button href="/register" variant="secondary">
                  S&apos;inscrire
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
