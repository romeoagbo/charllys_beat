"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "500+", label: "Audios disponibles" },
  { value: "120+", label: "Artistes actifs" },
  { value: "50+", label: "Experts musicaux" },
  { value: "10k+", label: "Téléchargements" },
];

export function Stats() {
  return (
    <section className="border-y border-border bg-surface py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold gold-gradient md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
