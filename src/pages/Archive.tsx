"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';
import { Link } from 'react-router-dom';

const STATES = [
  { id: 'sthira', name: 'Sthira', meaning: 'Grounded stability', video: '/src/assets/sthira.mp4', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800' },
  { id: 'mauna', name: 'Mauna', meaning: 'The great silence', video: '/src/assets/mouna.mp4', img: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800' },
  { id: 'nirmalya', name: 'Nirmalya', meaning: 'Purity', video: '/src/assets/nirmalaya.mp4', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800' },
  { id: 'prarthana', name: 'Prarthana', meaning: 'Prayer', img: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800' },
  { id: 'chinmaya', name: 'Chinmaya', meaning: 'Pure consciousness', video: '/src/assets/chinmaya.mp4', img: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800' },
  { id: 'ananda', name: 'Ananda', meaning: 'Bliss', img: 'https://images.unsplash.com/photo-1576188973526-0e5d742240ad?auto=format&fit=crop&q=80&w=800' },
  { id: 'mukti', name: 'Mukti', meaning: 'Liberation', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800' },
];

const Archive = () => {
  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      {/* Sutra Knot Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="mt-24"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 animate-bounce">Scroll to Begin the Journey</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Sequential Stages Flow */}
      <div className="relative">
        {STATES.map((state, index) => (
          <section 
            key={state.id} 
            className="min-h-screen flex flex-col items-center justify-center py-32 px-6 md:px-12 relative overflow-hidden"
          >
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Visual Side */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className={`order-1 flex justify-center ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}
              >
                <Link 
                  to={`/state/${state.id}`} 
                  className="block w-fit group relative overflow-hidden shadow-2xl"
                >
                  {state.video ? (
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="max-w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-1000 block"
                    >
                      <source src={state.video} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="aspect-[3/4] w-full max-w-md">
                      <img 
                        src={state.img} 
                        alt={state.name} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700 pointer-events-none" />
                </Link>
              </motion.div>

              {/* Content Side */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                className={`space-y-8 text-center lg:text-left ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}
              >
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">Stage 0{index + 1}</span>
                  <h3 className="text-5xl md:text-7xl serif font-light tracking-tight">{state.name}</h3>
                </div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground/60 max-w-xs mx-auto lg:mx-0">
                  {state.meaning}
                </p>
                <div className="pt-8">
                  <Link 
                    to={`/state/${state.id}`} 
                    className="inline-block text-[10px] uppercase tracking-[0.4em] border-b border-primary/20 pb-2 hover:border-primary transition-all"
                  >
                    Enter the State
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Background Number (Subtle) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.02] pointer-events-none">
              <span className="text-[40vw] font-bold leading-none">0{index + 1}</span>
            </div>
          </section>
        ))}
      </div>

      <footer className="py-32 text-center bg-white/30 backdrop-blur-sm">
        <div className="max-w-xs mx-auto space-y-12">
          <SutraKnot className="w-6 h-6 mx-auto text-primary/20" />
          <p className="text-sm serif italic text-muted-foreground">"The journey ends where the intention begins."</p>
          <Link to="/ledger" className="block text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors">
            The Artisan's Ledger
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Archive;