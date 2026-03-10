import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SutraKnot } from '@/components/SutraKnot';

const Index = () => {
  const [accessCode, setAccessCode] = useState('');
  const navigate = useNavigate();

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.length > 2) {
      navigate('/archive');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#F5F2ED] overflow-hidden">
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.5 }}
        >
          <SutraKnot className="w-12 h-12 mb-12 text-primary/40" />
          <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-tight serif text-[#2C2C2C]">
            A private archive of seven spiritual states.
          </h1>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-16">
            For those who seek the resonance of heritage.
          </p>
        </motion.div>

        <motion.form 
          onSubmit={handleRequest}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="w-full max-w-xs space-y-8"
        >
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Request Access"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full bg-transparent border-b border-primary/20 py-4 text-center focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 placeholder:uppercase placeholder:tracking-widest text-sm"
            />
            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary transition-all duration-700 group-focus-within:w-full" />
          </div>
          
          <button 
            type="submit"
            className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors"
          >
            Enter the Silence
          </button>
        </motion.form>
      </div>

      <div className="absolute bottom-12 left-12 hidden md:block">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 vertical-text">
          Aishee & Lasya Rituals
        </p>
      </div>
    </div>
  );
};

export default Index;