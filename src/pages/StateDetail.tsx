"use client";

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';

const STATE_DATA: Record<string, any> = {
  sthira: {
    name: 'Sthira',
    verse: 'The luxury of being unshakeable.',
    blueprint: 'Hand-spun 200-count Khadi, protein-washed for a liquid drape.',
    ritual: "To be worn with Lasya's Vetiver Grounding Oil.",
    video: '/src/assets/sthira.mp4',
    img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200'
  },
  mauna: {
    name: 'Mauna',
    verse: 'The great silence within the weave.',
    blueprint: 'Organic cotton-silk blend, naturally dyed with charcoal.',
    ritual: "To be worn with Lasya's Sandalwood Meditation Balm.",
    video: '/src/assets/mauna.mp4',
    img: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1200'
  },
  nirmalya: {
    name: 'Nirmalya',
    verse: 'The purity of the first offering.',
    blueprint: 'Fine Mulmul with hand-pressed floral motifs.',
    ritual: "To be worn with Lasya's Jasmine Infusion.",
    video: '/src/assets/nirmalaya.mp4',
    img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200'
  },
  prarthana: {
    name: 'Prarthana',
    verse: 'A prayer woven into every stitch.',
    blueprint: 'Hand-loomed silk with gold zari borders.',
    ritual: "To be worn with Lasya's Saffron Anointing Oil.",
    video: '/src/assets/prarthana.mp4',
    img: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=1200'
  },
  chinmaya: {
    name: 'Chinmaya',
    verse: 'The clarity of pure consciousness.',
    blueprint: 'Sheer organza with intricate white-on-white embroidery.',
    ritual: "To be worn with Lasya's Lotus Seed Essence.",
    video: '/src/assets/chinmaya.mp4',
    img: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1200'
  },
  ananda: {
    name: 'Ananda',
    verse: 'The bliss of being.',
    blueprint: 'Vibrant hand-dyed Jamdani in celestial hues.',
    ritual: "To be worn with Lasya's Rose Petal Mist.",
    video: '/src/assets/ananda.mp4',
    img: 'https://images.unsplash.com/photo-1576188973526-0e5d742240ad?auto=format&fit=crop&q=80&w=1200'
  },
  mukti: {
    name: 'Mukti',
    verse: 'The liberation of the soul.',
    blueprint: 'Weightless linen-silk blend in ethereal white.',
    ritual: "To be worn with Lasya's Frankincense Grounding Resin.",
    video: '/src/assets/mukti.mp4',
    img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1200'
  }
};

const StateDetail = () => {
  const { id } = useParams();
  const state = STATE_DATA[id as string] || STATE_DATA.sthira;

  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center z-50">
        <Link to="/archive" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
          Back to Archive
        </Link>
        <SutraKnot className="w-6 h-6 text-primary/20" />
      </nav>

      <div className="flex flex-col lg:flex-row min-h-screen">
        <div className="w-full lg:w-1/2 h-[60vh] lg:h-screen sticky top-0 overflow-hidden bg-black">
          {state.video ? (
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-contain"
            >
              <source src={state.video} type="video/mp4" />
            </video>
          ) : (
            <motion.img 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2 }}
              src={state.img} 
              alt={state.name}
              className="w-full h-full object-cover grayscale"
            />
          )}
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 py-24 space-y-16">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="space-y-4"
          >
            <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">The State</span>
            <h1 className="text-5xl md:text-7xl serif font-light">{state.name}</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="space-y-12 max-w-md"
          >
            <div className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">The Verse</h3>
              <p className="text-xl serif italic leading-relaxed">"{state.verse}"</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">The Blueprint</h3>
              <p className="text-sm leading-relaxed text-primary/80">{state.blueprint}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">The Ritual Pairing</h3>
              <p className="text-sm leading-relaxed text-primary/80">{state.ritual}</p>
            </div>

            <div className="pt-12">
              <Link to="/reserve">
                <button className="w-full py-6 border border-primary/10 hover:border-primary/40 transition-all text-[10px] uppercase tracking-[0.5em] text-primary/60 hover:text-primary">
                  Reserve the Work
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StateDetail;