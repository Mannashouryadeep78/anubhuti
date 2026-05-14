"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface RequestAccessModalProps {
  trigger: React.ReactNode;
}

const RequestAccessModal = ({ trigger }: RequestAccessModalProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Send OTP via Supabase Auth
      // This sends a 6-digit code directly to the user's email.
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // 2. Store email for verification on the Index page
      localStorage.setItem('pending_access_email', formData.email.trim().toLowerCase());

      // 3. Log the request for the admin
      await supabase.from('access_requests').insert([
        { 
          full_name: formData.name, 
          email: formData.email.trim().toLowerCase(), 
          phone: formData.phone,
          status: 'approved'
        }
      ]);

      // FOR TESTING: Since real emails can sometimes be delayed or filtered,
      // we show a success message and remind them to check spam.
      toast.success("Passcode sent. Please check your inbox and spam folder.");
      
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("OTP Error:", error);
      toast.error(error.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && setTimeout(() => setIsSubmitted(false), 300)}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border border-[#C5A059]/20 text-white p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-8">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-2xl serif font-light tracking-wide text-[#C5A059]">Request Invitation</DialogTitle>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-2">Join the private archive</p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-white/60">Full Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-white/60">Email Address</Label>
                  <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-white/60">Phone Number</Label>
                  <Input type="tel" required value={formData.phoneonChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-black rounded-none h-14 text-[10px] uppercase tracking-[0.4em] font-bold mt-4">
                  {isLoading ? "Sending Code..." : "Get Instant Access"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full border border-[#C5A059]/30 flex items-center justify-center mb-8">
                <Mail className="text-[#C5A059] w-8 h-8" />
              </div>
              <h3 className="text-2xl serif font-light text-[#C5A059] mb-4">Code Sent</h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-[240px] mx-auto mb-6">
                A 6-digit passcode has been sent to <strong>{formData.email}</strong>. 
              </p>
              
              <div className="flex items-start gap-3 bg-white/5 p-4 text-left mb-8 border border-white/5">
                <AlertCircle className="text-[#C5A059] w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">
                  If you don't see it in your inbox within a minute, please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
                </p>
              </div>

              <div className="mt-4">
                <DialogTrigger asChild>
                  <button className="text-[10px] uppercase tracking-[0.4em] bg-white/10 hover:bg-white/20 text-white px-8 py-4 transition-all">
                    Return to Entry
                  </button>
                </DialogTrigger>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default RequestAccessModal;