"use client";

import React, { useState } from 'react';
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
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
            <div className="text-center py-20 space-y-8">
              <p className="text-sm text-white/40 italic">The archive is empty.</p>
              <Button 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/orders');
                }}
                variant="outline" 
                className="w-full border-white/20 hover:bg-white/10 text-white rounded-none h-12 text-[10px] uppercase tracking-[0.4em]"
              >
                View Order History
              </Button>
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
                    <div className="flex items-center gap-3 mt-2 border border-white/20 w-max px-2 py-0.5">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-white/40 hover:text-white w-4 h-4 flex items-center justify-center text-xs">-</button>
                      <span className="text-[10px] text-white w-2 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-white/40 hover:text-white w-4 h-4 flex items-center justify-center text-xs">+</button>
                    </div>
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
          <div className="border-t border-white/10 pt-8 space-y-4">
            <div className="flex justify-between items-end pb-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Subtotal</span>
              <span className="text-xl serif">₹{total.toLocaleString()}</span>
            </div>
            <Button 
              onClick={() => {
                setIsOpen(false);
                navigate('/checkout');
              }}
              className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-black rounded-none h-14 text-[10px] uppercase tracking-[0.4em] font-bold"
            >
              Proceed to Checkout
            </Button>
            <Button 
              onClick={() => {
                setIsOpen(false);
                navigate('/orders');
              }}
              variant="outline"
              className="w-full bg-transparent border-white/20 hover:bg-white/5 text-white rounded-none h-12 text-[10px] uppercase tracking-[0.4em]"
            >
              Order History
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;