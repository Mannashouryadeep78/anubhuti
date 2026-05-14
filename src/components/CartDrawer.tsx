"use client";

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
  const { cart, removeFromCart, total } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button 
          className="relative p-2 hover:opacity-70 transition-opacity z-[60]"
          aria-label="Open Cart"
        >
          <ShoppingBag size={20} strokeWidth={1.5} />
          {cart.length > 0 && (
            <span className="absolute top-0 right-0 bg-[#C5A059] text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent 
        side="right"
        className="bg-[#0A0A0A] border-l border-white/10 text-white w-full sm:max-w-md flex flex-col z-[100]"
      >
        <SheetHeader className="border-b border-white/10 pb-6">
          <SheetTitle className="text-2xl serif font-light text-[#C5A059]">Your Selection</SheetTitle>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto py-8 space-y-8">
          {cart.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <p className="text-sm text-white/40 italic">The archive is empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-6 group">
                <div className="w-24 h-32 bg-white/5 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                </div>
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div>
                    <h4 className="text-lg serif">{item.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-light">₹{item.price.toLocaleString()}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-white/10 pt-8 space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Subtotal</span>
              <span className="text-xl serif">₹{total.toLocaleString()}</span>
            </div>
            <Button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-black rounded-none h-14 text-[10px] uppercase tracking-[0.4em] font-bold"
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;