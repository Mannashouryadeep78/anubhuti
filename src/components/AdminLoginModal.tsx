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
import { Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AdminLoginModalProps {
  trigger: React.ReactNode;
}

const AdminLoginModal = ({ trigger }: AdminLoginModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast.success("Welcome back, Admin.");
      setIsOpen(false);
      navigate('/admin/portal');
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-[#0A0A0A] border border-[#C5A059]/20 text-white p-0 overflow-hidden">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="w-12 h-12 rounded-full border border-[#C5A059]/20 flex items-center justify-center mb-4 mx-auto">
              <Lock className="text-[#C5A059] w-5 h-5" />
            </div>
            <DialogTitle className="text-2xl serif font-light tracking-wide text-[#C5A059] text-center">Admin Access</DialogTitle>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-2 text-center">Enter your credentials to manage the archive</p>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-white/60">Email Address</Label>
              <Input 
                type="email" 
                required 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" 
                placeholder="admin@anubhuti.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-white/60">Password</Label>
              <Input 
                type="password" 
                required 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                className="bg-transparent border-white/10 focus:border-[#C5A059] rounded-none h-12 text-sm" 
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-black rounded-none h-14 text-[10px] uppercase tracking-[0.4em] font-bold mt-4"
            >
              {isLoading ? "Authenticating..." : "Login to Portal"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLoginModal;