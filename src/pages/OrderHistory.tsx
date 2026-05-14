"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const OrderHistory = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('anubhuti_orders');
    if (saved) setOrders(JSON.parse(saved));
  }, []);

  const handleCancel = (orderId: string) => {
    const updated = orders.map(order => 
      order.id === orderId ? { ...order, status: 'Cancelled' } : order
    );
    setOrders(updated);
    localStorage.setItem('anubhuti_orders', JSON.stringify(updated));
    toast.info("Order cancellation requested.");
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] py-32 px-6">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="text-center space-y-4">
          <SutraKnot className="w-8 h-8 mx-auto text-primary/20" />
          <h1 className="text-4xl serif font-light">Your Intentions</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">A record of your journey</p>
        </header>

        <div className="space-y-8">
          {orders.length === 0 ? (
            <div className="text-center py-20 space-y-8">
              <p className="text-sm text-muted-foreground italic">No orders found in the archive.</p>
              <Link to="/archive">
                <Button variant="outline" className="rounded-none uppercase tracking-widest text-[10px]">Explore Archive</Button>
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 border border-primary/5 space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/5 pb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Order ID: {order.id}</p>
                    <p className="text-sm serif mt-1">Placed on {order.date}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`text-[10px] uppercase tracking-widest px-3 py-1 ${
                      order.status === 'Cancelled' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                    }`}>
                      {order.status}
                    </span>
                    {order.status !== 'Cancelled' && (
                      <button 
                        onClick={() => handleCancel(order.id)}
                        className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <p className="text-sm serif">{item.name} <span className="text-[10px] text-muted-foreground ml-2">x{item.quantity}</span></p>
                      <p className="text-sm">₹{item.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-primary/5 flex justify-between items-end">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Investment</p>
                  <p className="text-xl serif">₹{order.total.toLocaleString()}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;