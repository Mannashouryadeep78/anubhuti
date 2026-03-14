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
        localStorage.setItem('anubhuti_access', 'true');
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
          localStorage.setItem('anubhuti_access', 'true');
          toast.success("Access granted. Welcome.");
          navigate('/archive');
        } else {
          toast.error("Invalid or expired passcode.", {
            style: { background: '#0A0A0A', color: '#C5A059', border: '1px solid rgba(197, 160, 89, 0.2)' }
          });
        }
      } else {
        // Fallback if Supabase isn't connected
        if (passcode === '1234') {
          localStorage.setItem('anubhuti_access', 'true');
          navigate('/archive');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60">
        <source src="/src/assets/background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.5 }}>
          <SutraKnot className="w-12 h-12 mb-12 text-[#C5A059]/60" />
          <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-tight serif text-white">A private archive of seven spiritual states.</h1>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-20">For those who seek the resonance of heritage.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="w-full max-w-xs space-y-12">
          <form onSubmit={handleEnter} className="space-y-8">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Enter Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={isVerifying}
                className="w-full bg-transparent border-b border-white/20 py-4 text-center focus:outline-none focus:border-[#C5A059] transition-all duration-700 placeholder:text-white/20 placeholder:uppercase placeholder:tracking-[0.4em] text-sm text-white tracking-[0.5em]"
              />
            </div>
            <button type="submit" disabled={isVerifying} className="text-[10px] uppercase tracking-[0.5em] text-white/40 hover:text-[#C5A059] transition-colors font-bold">
              {isVerifying ? "Verifying..." : "Enter the Silence"}
            </button>
          </form>
          <div className="pt-4">
            <RequestAccessModal trigger={<button className="text-[9px] uppercase tracking-[0.3em] text-[#C5A059]/60 hover:text-[#C5A059] transition-colors border-b border-[#C5A059]/20 pb-1">Request Private Access</button>} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;