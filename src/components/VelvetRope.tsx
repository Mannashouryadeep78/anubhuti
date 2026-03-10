"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import SutraKnot from './SutraKnot';

interface VelvetRopeProps {
  onAccess: () => void;
}

const VelvetRope = ({ onAccess }: VelvetRopeProps) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) onAccess();
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#F5F2ED]">
      {/* Background Image - Cinematic Texture */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&q=80&w=2000" 
          alt="Textile Texture"
          className="w-full h-full object-cover grayscale"
        />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        <SutraKnot className="w-12 h-12 mb-12 text-primary/60" />
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
          className="text-4xl md:text-5xl font-serif mb-6 text-primary"
        >
          A private archive of seven spiritual states.
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1.5 }}
          className="text-lg font-serif italic text-muted-foreground mb-16"
        >
          For those who seek the resonance of heritage.
        </motion.p>

        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1.5 }}
          className="w-full max-w-sm space-y-4"
        >
          <div className="relative group">
            <label className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Request Access
            </label>
            <Input 
              type="email"
              placeholder="Enter your frequency"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-b border-t-0 border-x-0 border-primary/20 rounded-none focus-visible:ring-0 focus:border-primary transition-colors text-center placeholder:text-muted-foreground/40 font-serif italic"
              required
            />
          </div>
          <button 
            type="submit"
            className="mt-8 text-[11px] uppercase tracking-[0.4em] text-primary hover:text-primary/60 transition-colors"
          >
            Enter the Archive
          </button>
        </motion.form>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 2 }}
        className="absolute bottom-12 text-[10px] uppercase tracking-[0.5em] text-muted-foreground/60"
      >
        Aishee — Manifested in Phulia
      </motion.div>
    </div>
  );
};

export default VelvetRope;