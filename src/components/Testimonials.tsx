"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "J'ai vendu mes premiers beats en une semaine. La plateforme est intuitive et le paiement Mobile Money fonctionne parfaitement.",
    author: "Kofi M.",
    role: "Beatmaker, Lomé",
  },
  {
    quote:
      "Enregistrer mes vocaux directement dans le navigateur m'a fait gagner un temps fou. Les experts sont réactifs.",
    author: "Amina B.",
    role: "Chanteuse, Cotonou",
  },
  {
    quote:
      "En tant que producteur, je reçois des maquettes de qualité et je peux mixer directement via la plateforme.",
    author: "Jean-Paul D.",
    role: "Ingénieur son, Abidjan",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold md:text-4xl">
            Ce qu&apos;en disent nos{" "}
            <span className="gold-gradient">artistes</span>
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <p className="text-muted leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 border-t border-border pt-4">
                <p className="font-semibold text-gold">{t.author}</p>
                <p className="text-sm text-muted">{t.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
