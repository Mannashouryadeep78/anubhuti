"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zip: ''
  });

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center p-6">
        <p className="text-xl serif mb-8">Your selection is empty.</p>
        <Button onClick={() => navigate('/archive')} variant="outline" className="rounded-none uppercase tracking-widest text-[10px]">Return to Archive</Button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate order processing
    setTimeout(() => {
      const order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toLocaleDateString(),
        items: cart,
        total: total,
        status: 'Processing',
        shipping: formData
      };

      // Save to local storage for "Order History"
      const existingOrders = JSON.parse(localStorage.getItem('anubhuti_orders') || '[]');
      localStorage.setItem('anubhuti_orders', JSON.stringify([order, ...existingOrders]));

      clearCart();
      toast.success("Order placed successfully.");
      navigate('/orders');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] py-32 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
          <header className="space-y-4">
            <h1 className="text-4xl serif font-light">Shipping Details</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Where the work will reside</p>
          </header>

          <form onSubmit={handlePlaceOrder} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest">Full Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest">Email Address</Label>
                <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest">Shipping Address</Label>
                <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest">City</Label>
                  <Input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest">ZIP Code</Label>
                  <Input required value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-primary text-primary-foreground rounded-none h-16 text-[10px] uppercase tracking-[0.5em] font-bold"
            >
              {isProcessing ? "Processing Ritual..." : "Confirm Order"}
            </Button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/50 p-12 space-y-12">
          <h2 className="text-2xl serif font-light">Summary</h2>
          <div className="space-y-8">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-16 bg-muted overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale" />
                  </div>
                  <div>
                    <p className="text-sm serif">{item.name}</p>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="text-sm">₹{item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-primary/10 pt-8 flex justify-between items-end">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total Investment</span>
            <span className="text-2xl serif">₹{total.toLocaleString()}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;