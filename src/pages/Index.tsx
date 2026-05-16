"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SutraKnot } from '@/components/SutraKnot';
import RequestAccessModal from '@/components/RequestAccessModal';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface IndexProps {
  onStartTransition: () => void;
}

const API_BASE = "/api/v1";

const Index = ({ onStartTransition }: IndexProps) => {
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;
    
    setIsVerifying(true);

    try {
      // 1. Try to call the Backend Auth Service
      try {
        const response = await fetch(`${API_BASE}/auth/verify-passcode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code: passcode,
            email: localStorage.getItem('pending_access_email')
          })
        });

        // Check if the response is actually JSON before parsing
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          localStorage.setItem('anubhuti_access', 'true');
          localStorage.setItem('anubhuti_token', data.accessToken);
          localStorage.setItem('anubhuti_user_id', data.userId);
          proceed();
          return;
        }
      } catch (apiErr) {
        console.log("Backend not reachable, falling back to direct database check.");
      }

      // 2. Fallback: Direct Supabase Check (For Preview/Testing)
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', passcode.trim())
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        localStorage.setItem('anubhuti_access', 'true');
        localStorage.setItem('anubhuti_user_id', data[0].id);
        toast.success("Identity verified via secure fallback.");
        proceed();
      } else {
        throw new Error("Invalid or expired passcode.");
      }

    } catch (err: any) {
      toast.error(err.message || "Access denied.", {
        style: { background: '#0A0A0A', color: '#C5A059', border: '1px solid rgba(197, 160, 89, 0.2)' }
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const proceed = () => {
    onStartTransition();
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/archive');
    }, 4000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60">
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      <motion.div 
        animate={isNavigating ? { opacity: 0, scale: 0.9, filter: 'blur(10px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl"
      >
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
              {isVerifying ? (isNavigating ? "Entering..." : "Verifying...") : "Enter the Silence"}
            </button>
          </form>
          <div className="pt-4">
            <RequestAccessModal trigger={<button className="text-[9px] uppercase tracking-[0.3em] text-[#C5A059]/60 hover:text-[#C5A059] transition-colors border-b border-[#C5A059]/20 pb-1">Request Private Access</button>} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;