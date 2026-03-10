"use client";

import React from 'react';
import { motion } from 'framer-motion';
import SutraKnot from './SutraKnot';

interface GarmentProps {
  state: string;
  title: string;
  verse: string;
  blueprint: string;
  ritual: string;
  image: string;
}

const GarmentCard = ({ state, title, verse, blueprint, ritual, image }: GarmentProps) => {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 2 }}
      viewport={{ once: true, margin: "-100px" }}
      className="min-h-screen flex flex-col md:flex-row items-center justify-center px-6 md:px-24 py-24 gap-12 md:gap-24 border-b border-primary/5"
    >
      {/* Image Section */}
      <div className="w-full md:w-1/2 h-[60vh] md:h-[80vh] overflow-hidden relative group">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 3, ease: "easeOut" }}
          src={image} 
          alt={title}
          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[3s]"
        />
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      </div>

      {/* Content Section */}
      <div className="w-full md:w-1/2 flex flex-col items-start max-w-lg">
        <div className="flex items-center gap-4 mb-8">
          <SutraKnot className="w-6 h-6 text-primary/40" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
            State: {state}
          </span>
        </div>

        <h2 className="text-5xl md:text-6xl font-serif mb-12 text-primary">
          {title}
        </h2>

        <div className="space-y-12">
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The Verse</h3>
            <p className="text-xl font-serif italic text-primary/80 leading-relaxed">
              "{verse}"
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The Blueprint</h3>
            <p className="text-sm font-serif text-muted-foreground leading-relaxed">
              {blueprint}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The Ritual Pairing</h3>
            <p className="text-sm font-serif text-muted-foreground leading-relaxed">
              {ritual}
            </p>
          </div>

          <button 
            className="mt-12 px-12 py-4 border border-primary/20 text-[11px] uppercase tracking-[0.4em] hover:bg-primary hover:text-background transition-all duration-700"
            onClick={() => window.open('https://wa.me/yournumber', '_blank')}
          >
            Reserve the Work
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export default GarmentCard;