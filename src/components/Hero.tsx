"use client";

import { motion } from "framer-motion";
import { Button } from "./Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-sm font-medium uppercase tracking-widest text-gold"
        >
          Production musicale africaine
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-[1.1]"
        >
          Votre studio en ligne.{" "}
          <span className="gold-gradient">Créez. Vendez. Collaborez.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted md:text-xl"
        >
          Écoutez des extraits, achetez des beats, enregistrez vos vocaux et
          connectez-vous avec des experts musicaux — le tout depuis votre
          navigateur.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button href="/audios">Explorer les audios</Button>
          <Button href="/dashboard/submit" variant="secondary">
            Envoyer aux experts
          </Button>
        </motion.div>

        <div className="mx-auto mt-16 flex max-w-lg items-end justify-center gap-1">
          {Array.from({ length: 32 }).map((_, i) => {
            const barHeight = 8 + ((i * 7) % 40);
            return (
              <motion.div
                key={i}
                className="w-1 origin-bottom rounded-full bg-gold/60 will-change-transform"
                style={{ height: barHeight }}
                animate={{ scaleY: [0.35, 1, 0.35] }}
                transition={{
                  duration: 1.2 + (i % 5) * 0.2,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
