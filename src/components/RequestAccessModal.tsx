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
import { CheckCircle2 } from 'lucide-react';
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
      let requestId = crypto.randomUUID();

      // 1. Save to Supabase first to get a record
      if (supabase) {
        const { error } = await supabase.from('access_requests').insert([
          { 
            id: requestId,
            full_name: formData.name, 
            email: formData.email, 
            phone: formData.phone,
            status: 'pending'
          }
        ]);
        if (error) throw error;
      }

      // 2. Send Email Notification to Admin with Approval Link
      const approvalLink = `${window.location.origin}/admin/portal?approve=${requestId}`;
      
      await fetch("https://formsubmit.co/ajax/mannashouryadeep78@gmail.com", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          _subject: "ACTION REQUIRED: New Access Request",
          "Approval Link": approvalLink,
          _message: `A new request has been received. Click the link below to approve and send the OTP.\n\n${approvalLink}`
        })
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("There was an issue sending your request.");
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
                  <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-black rounded-none h-14 text-[10px] uppercase tracking-[0.4em] font-bold mt-4">
                  {isLoading ? "Processing..." : "Submit Request"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full border border-[#C5A059]/30 flex items-center justify-center mb-8">
                <CheckCircle2 className="text-[#C5A059] w-8 h-8" />
              </div>
              <h3 className="text-2xl serif font-light text-[#C5A059] mb-4">Request Received</h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-[240px] mx-auto">Your intention has been noted. We will review your request shortly.</p>
              <div className="mt-12">
                <DialogTrigger asChild>
                  <button className="text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-[#C5A059]">Close</button>
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