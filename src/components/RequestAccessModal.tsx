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
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface RequestAccessModalProps {
  trigger: React.ReactNode;
}

const RequestAccessModal = ({ trigger }: RequestAccessModalProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Generate a 6-digit OTP immediately
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(otp);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3); // Valid for 3 days

      // 2. Save to Supabase
      if (supabase) {
        await supabase.from('access_codes').insert([
          { 
            email: formData.email, 
            code: otp, 
            expires_at: expiresAt.toISOString() 
          }
        ]);
        
        await supabase.from('access_requests').insert([
          { 
            full_name: formData.name, 
            email: formData.email, 
            phone: formData.phone,
            status: 'approved'
          }
        ]);
      }

      // 3. Attempt to send email (as a backup)
      // Note: FormSubmit requires a one-time activation per recipient email.
      // By showing the code on screen, we bypass this friction for the user.
      fetch(`https://formsubmit.co/ajax/${formData.email}`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _subject: "Your Private Access Code - Anubhuti",
          message: `Welcome to Anubhuti.\n\nYour private passcode is: ${otp}\n\nThis code is valid for 72 hours.`,
          _template: "box",
          _captcha: "false"
        })
      }).catch(() => console.log("Email backup failed, but code is shown on screen."));

      setIsSubmitted(true);
      toast.success("Access granted instantly.");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("There was an issue processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied to clipboard");
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
                  <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-black rounded-none h-14 text-[10px] uppercase tracking-[0.4em] font-bold mt-4">
                  {isLoading ? "Processing..." : "Get Instant Access"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-16 h-16 rounded-full border border-[#C5A059]/30 flex items-center justify-center mb-8">
                <CheckCircle2 className="text-[#C5A059] w-8 h-8" />
              </div>
              <h3 className="text-2xl serif font-light text-[#C5A059] mb-2">Access Granted</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-8">Your private passcode is ready</p>
              
              <div className="bg-white/5 border border-white/10 p-6 w-full mb-8 group relative">
                <span className="text-3xl tracking-[0.5em] font-light text-white block mb-2">{generatedCode}</span>
                <button 
                  onClick={copyToClipboard}
                  className="text-[9px] uppercase tracking-widest text-[#C5A059] hover:text-white transition-colors flex items-center justify-center w-full gap-2"
                >
                  <Copy size={10} /> Copy Code
                </button>
              </div>

              <p className="text-[11px] text-white/60 leading-relaxed max-w-[240px] mx-auto mb-12">
                Use this code on the entry screen to unlock the archive. It is valid for 72 hours.
              </p>

              <DialogTrigger asChild>
                <button className="text-[10px] uppercase tracking-[0.4em] bg-white/10 hover:bg-white/20 text-white px-8 py-4 transition-all">
                  Return to Entry
                </button>
              </DialogTrigger>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default RequestAccessModal;