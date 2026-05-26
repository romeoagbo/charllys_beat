"use client";

import { motion } from "framer-motion";

const categories = [
  { name: "Afrobeats", emoji: "🎵" },
  { name: "Hip-Hop", emoji: "🎤" },
  { name: "R&B", emoji: "💜" },
  { name: "Gospel", emoji: "✨" },
  { name: "Instrumental", emoji: "🎹" },
  { name: "Voix & Acapella", emoji: "🎙️" },
];

export function Categories() {
  return (
    <section id="categories" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold md:text-4xl">
            Explorez par <span className="gold-gradient">catégorie</span>
          </h2>
          <p className="mt-3 text-muted">
            Trouvez le son qui correspond à votre projet
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.name}
              href={`/audios?category=${encodeURIComponent(cat.name)}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4, borderColor: "rgba(212, 175, 55, 0.5)" }}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-6 transition-colors hover:bg-surface-elevated"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-sm font-medium group-hover:text-gold">
                {cat.name}
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
