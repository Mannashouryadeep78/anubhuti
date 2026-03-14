"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SutraKnot } from '@/components/SutraKnot';

const Ledger = () => {
  return (
    <div className="min-h-screen bg-[#F5F2ED] py-32 px-6">
      <div className="max-w-4xl mx-auto space-y-32">
        <header className="text-center space-y-8">
          <SutraKnot className="w-8 h-8 mx-auto text-primary/20" />
          <h1 className="text-4xl serif font-light">The Artisan's Ledger</h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="aspect-square bg-muted overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1590739225287-bd2ba5198922?auto=format&fit=crop&q=80&w=800" 
              alt="Artisan Hands" 
              className="w-full h-full object-cover grayscale"
            />
          </div>
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Sanctity of Material</p>
            <p className="text-lg serif leading-relaxed italic">
              "The hands in Phulia do not weave thread; they count breaths. Every Khadi thread is treated as a sacred relic, a vessel for the frequency of the weaver."
            </p>
          </div>
        </section>

        <section className="text-center max-w-2xl mx-auto space-y-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Purity of Science</p>
          <p className="text-xl serif leading-relaxed">
            Lasya skincare formulations are presented like alchemical rituals. We do not manufacture; we manifest through the intersection of fiber and frequency.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Ledger;