"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';
import { Link } from 'react-router-dom';

const STATES = [
  { id: 'sthira', name: 'Sthira', meaning: 'Grounded stability', video: '/src/assets/sthira.mp4', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800' },
  { id: 'mauna', name: 'Mauna', meaning: 'The great silence', img: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800' },
  { id: 'nirmalya', name: 'Nirmalya', meaning: 'Purity', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800' },
  { id: 'prarthana', name: 'Prarthana', meaning: 'Prayer', img: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800' },
  { id: 'chinmaya', name: 'Chinmaya', meaning: 'Pure consciousness', img: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800' },
  { id: 'ananda', name: 'Ananda', meaning: 'Bliss', img: 'https://images.unsplash.com/photo-1576188973526-0e5d742240ad?auto=format&fit=crop&q=80&w=800' },
  { id: 'mukti', name: 'Mukti', meaning: 'Liberation', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800' },
];

const Archive = () => {
  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      {/* Sutra Knot Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-black">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/src/assets/sutra-knot.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F5F2ED]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative z-10 text-center px-6 max-w-3xl"
        >
          <SutraKnot className="w-10 h-10 mb-8 mx-auto text-[#C5A059]/60" />
          <h2 className="text-sm uppercase tracking-[0.5em] text-white/60 mb-6">The Sutra Knot</h2>
          <p className="text-2xl md:text-3xl serif italic text-white leading-relaxed">
            "This is a powerful metaphor for Connection. The knot isn't just a closure; it’s a commitment."
          </p>
        </motion.div>
      </section>

      <div className="py-24 px-6 md:px-12">
        <header className="max-w-7xl mx-auto mb-32 flex flex-col items-center text-center">
          <h2 className="text-sm uppercase tracking-[0.5em] text-muted-foreground mb-4">The Archive</h2>
          <p className="text-2xl serif italic text-primary/80">"These garments are not made. They are manifested."</p>
        </header>

        <div className="max-grid max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
          {STATES.map((state, index) => (
            <motion.div
              key={state.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 1 }}
              className="group"
            >
              <Link to={`/state/${state.id}`} className="block space-y-6">
                <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                  {state.video ? (
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                    >
                      <source src={state.video} type="video/mp4" />
                    </video>
                  ) : (
                    <img 
                      src={state.img} 
                      alt={state.name} 
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl serif tracking-wide">{state.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">0{index + 1}</span>
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60">{state.meaning}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <footer className="mt-48 text-center">
          <Link to="/ledger" className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors">
            The Artisan's Ledger
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default Archive;