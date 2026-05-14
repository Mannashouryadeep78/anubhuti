"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import emailjs from 'emailjs-com';

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
      // 1. Generate a custom 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // 2. Save the code to the database for verification
      if (supabase) {
        const { error: dbError } = await supabase.from('access_codes').insert([
          { 
            email: formData.email.trim().toLowerCase(), 
            code: otp, 
            expires_at: expiresAt.toISOString() 
          }
        ]);

        if (dbError) throw dbError;

        // Log the request for the admin
        await supabase.from('access_requests').insert([
          { 
            full_name: formData.name, 
            email: formData.email.trim().toLowerCase(), 
            phone: formData.phone,
            status: 'approved'
          }
        ]);
      }

      // 3. Send the email via EmailJS
      // IMPORTANT: Replace these placeholders with your actual EmailJS credentials
      const SERVICE_ID = "service_id"; // e.g., "service_gmail"
      const TEMPLATE_ID = "template_id"; // e.g., "template_otp"
      const PUBLIC_KEY = "public_key"; // Your EmailJS Public Key

      const templateParams = {
        to_name: formData.name,
        to_email: formData.email,
        otp_code: otp,
        reply_to: 'noreply@anubhuti.com'
      };

      // We attempt to send. If IDs are placeholders, it will fail but we'll catch it.
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

      // 4. Store email for verification on the Index page
      localStorage.setItem('pending_access_email', formData.email.trim().toLowerCase());

      toast.success(`Passcode sent to ${formData.email}`);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Email/OTP Error:", error);
      // If EmailJS fails because of missing IDs, we still show success in UI for demo purposes
      // but log the error so the developer knows to fix the IDs.
      if (error.text === "The user_id parameter is required") {
        toast.error("EmailJS not configured. Please add your Public Key.");
      } else {
        toast.error("Failed to send email. Please try again.");
      }
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
                <DialogDescription className="text-xs uppercase tracking-[0.2em] text-white/40 mt-2">
                  Your unique access code will be sent to your email.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-white/60">Full Name</Label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-white/60">Email Address</Label>
                  <Input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-white/60">Phone Number</Label>
                  <Input 
                    type="tel" 
                    required 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" 
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-black rounded-none h-14 text-[10px] uppercase tracking-[0.4em] font-bold mt-4">
                  {isLoading ? "Sending..." : "Request Access"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full border border-[#C5A059]/30 flex items-center justify-center mb-8">
                <CheckCircle2 className="text-[#C5A059] w-8 h-8" />
              </div>
              <h3 className="text-2xl serif font-light text-[#C5A059] mb-4">Request Received</h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-[240px] mx-auto mb-8">
                A private passcode has been dispatched to <strong>{formData.email}</strong>.
              </p>
              
              <div className="flex items-start gap-3 bg-white/5 p-4 text-left mb-8 border border-white/5">
                <AlertCircle className="text-[#C5A059] w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">
                  Please check your inbox and spam folder. Use the code on the main screen to enter the archive.
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