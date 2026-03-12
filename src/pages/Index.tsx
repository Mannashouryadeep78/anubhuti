"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SutraKnot } from '@/components/SutraKnot';
import RequestAccessModal from '@/components/RequestAccessModal';
import { toast } from 'sonner';

const Index = () => {
  const [passcode, setPasscode] = useState('');
  const navigate = useNavigate();

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation for demo purposes
    if (passcode === '1234' || passcode.toLowerCase() === 'anubhuti') {
      navigate('/archive');
    } else if (passcode.length > 0) {
      toast.error("Invalid passcode. Please try again or request access.", {
        style: {
          background: '#0A0A0A',
          color: '#C5A059',
          border: '1px solid rgba(197, 160, 89, 0.2)',
        }
      });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      >
        <source src="/src/assets/background.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.5 }}
        >
          <SutraKnot className="w-12 h-12 mb-12 text-[#C5A059]/60" />
          <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-tight serif text-white">
            A private archive of seven spiritual states.
          </h1>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-20">
            For those who seek the resonance of heritage.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="w-full max-w-xs space-y-12"
        >
          <form onSubmit={handleEnter} className="space-y-8">
            <div className="relative group">
              <input 
                type="password" 
                placeholder="Enter Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 py-4 text-center focus:outline-none focus:border-[#C5A059] transition-all duration-700 placeholder:text-white/20 placeholder:uppercase placeholder:tracking-[0.4em] text-sm text-white tracking-[0.5em]"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#C5A059] transition-all duration-700 group-focus-within:w-full" />
            </div>
            
            <button 
              type="submit"
              className="text-[10px] uppercase tracking-[0.5em] text-white/40 hover:text-[#C5A059] transition-colors font-bold"
            >
              Enter the Silence
            </button>
          </form>

          <div className="pt-4">
            <RequestAccessModal 
              trigger={
                <button className="text-[9px] uppercase tracking-[0.3em] text-[#C5A059]/60 hover:text-[#C5A059] transition-colors border-b border-[#C5A059]/20 pb-1">
                  Request Private Access
                </button>
              }
            />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-12 hidden md:block z-10">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#C5A059]/40 vertical-text font-bold">
          Aishee & Lasya Rituals
        </p>
      </div>
    </div>
  );
};

export default Index;