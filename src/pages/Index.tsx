"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SutraKnot } from '@/components/SutraKnot';
import RequestAccessModal from '@/components/RequestAccessModal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Index = () => {
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;
    
    setIsVerifying(true);

    try {
      // 1. Check for master override
      if (passcode === 'anubhuti_admin') {
        navigate('/archive');
        return;
      }

      // 2. Check Supabase for valid, non-expired code
      if (supabase) {
        const { data, error } = await supabase
          .from('access_codes')
          .select('*')
          .eq('code', passcode)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (data) {
          toast.success("Access granted. Welcome.");
          navigate('/archive');
        } else {
          toast.error("Invalid or expired passcode.", {
            style: { background: '#0A0A0A', color: '#C5A059', border: '1px solid rgba(197, 160, 89, 0.2)' }
          });
        }
      } else {
        // Fallback if Supabase isn't connected
        if (passcode === '1234') navigate('/archive');
      }
    } catch (err) {
      console.error(err);
      toast.error("Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background Video/Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black z-0" />
      
      <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3, duration: 1.2 }}
          className="w-full"
        >
          <SutraKnot className="w-10 h-10 mb-10 mx-auto text-[#C5A059]/60" />
          <h1 className="text-3xl md:text-5xl font-light mb-6 tracking-tight serif text-white leading-tight">
            A private archive of <br className="hidden md:block" /> seven spiritual states.
          </h1>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/40 mb-16 md:mb-20">
            For those who seek the resonance of heritage.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1, duration: 1 }} 
          className="w-full max-w-[280px] md:max-w-xs space-y-10 md:space-y-12"
        >
          <form onSubmit={handleEnter} className="space-y-8">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Enter Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={isVerifying}
                className="w-full bg-transparent border-b border-white/10 py-4 text-center focus:outline-none focus:border-[#C5A059] transition-all duration-700 placeholder:text-white/10 placeholder:uppercase placeholder:tracking-[0.4em] text-sm text-white tracking-[0.5em]"
              />
            </div>
            <button 
              type="submit" 
              disabled={isVerifying} 
              className="text-[10px] uppercase tracking-[0.5em] text-white/40 hover:text-[#C5A059] transition-colors font-bold w-full"
            >
              {isVerifying ? "Verifying..." : "Enter the Silence"}
            </button>
          </form>
          
          <div className="pt-4">
            <RequestAccessModal 
              trigger={
                <button className="text-[9px] uppercase tracking-[0.3em] text-[#C5A059]/60 hover:text-[#C5A059] transition-colors border-b border-[#C5A059]/10 pb-1">
                  Request Private Access
                </button>
              } 
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;