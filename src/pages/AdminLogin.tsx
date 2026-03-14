"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SutraKnot } from '@/components/SutraKnot';

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(false);

    // Specific credentials requested by the user
    if (formData.email === "mannashouryadeep78@gmail.com" && formData.password === "Deep*9748") {
      toast.success("Access granted, Admin.");
      navigate('/admin/portal');
      return;
    }

    // Fallback to Supabase if credentials don't match the hardcoded ones
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      toast.success("Welcome back.");
      navigate('/admin/portal');
    } catch (error: any) {
      toast.error("Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-12"
      >
        <div className="text-center space-y-6">
          <Link to="/" className="inline-flex items-center text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-[#C5A059] transition-colors mb-8">
            <ArrowLeft size={12} className="mr-2" /> Back to Entry
          </Link>
          <SutraKnot className="w-12 h-12 mx-auto text-[#C5A059]/40" />
          <h1 className="text-3xl serif text-[#C5A059] font-light">Admin Portal</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Secure access for archive management</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/60">Email Address</label>
            <input 
              type="email" 
              required 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-[#C5A059] transition-all text-sm text-white"
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/60">Password</label>
            <input 
              type="password" 
              required 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-[#C5A059] transition-all text-sm text-white"
              placeholder="Enter your password"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-black py-6 text-[10px] uppercase tracking-[0.4em] font-bold transition-colors mt-8"
          >
            {isLoading ? "Authenticating..." : "Enter Portal"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;