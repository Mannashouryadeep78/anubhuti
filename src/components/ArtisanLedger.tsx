"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ArtisanLedger = () => {
  return (
    <section className="py-32 px-6 md:px-24 bg-[#F0EDE8]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <h2 className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">The Artisan's Ledger</h2>
            <p className="text-3xl md:text-4xl font-serif leading-tight text-primary">
              "The hands in Phulia do not weave thread; they count breaths."
            </p>
            <div className="space-y-6 text-muted-foreground font-serif leading-relaxed">
              <p>
                Aishee explores the intersection of fiber and frequency. Our archive is not a collection of garments, but a series of manifestations. Each piece is a record of a specific spiritual state, captured in hand-loomed Khadi.
              </p>
              <p>
                Every thread is treated as a sacred relic, every Lasya formulation as an alchemical ritual. We do not create; we manifest.
              </p>
            </div>
            <button 
              className="mt-12 text-[11px] uppercase tracking-[0.4em] text-primary hover:text-primary/60 transition-colors"
              onClick={() => window.open('https://wa.me/yournumber', '_blank')}
            >
              Request a Personal Curation
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <motion.div 
              whileInView={{ y: -20 }}
              transition={{ duration: 2 }}
              className="h-[40vh] overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1590739225287-bd2a5d0bb5aa?auto=format&fit=crop&q=80&w=1000" 
                alt="Artisan Hands"
                className="w-full h-full object-cover grayscale"
              />
            </motion.div>
            <motion.div 
              whileInView={{ y: 20 }}
              transition={{ duration: 2 }}
              className="h-[40vh] overflow-hidden mt-12"
            >
              <img 
                src="https://images.unsplash.com/photo-1590739225287-bd2a5d0bb5aa?auto=format&fit=crop&q=80&w=1000" 
                alt="Loom Close-up"
                className="w-full h-full object-cover grayscale"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArtisanLedger;