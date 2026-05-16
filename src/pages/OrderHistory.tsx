"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { RefreshCw, Server, MapPin, PackageCheck, Truck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const OrderHistory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('anubhuti_token');
      const userId = localStorage.getItem('anubhuti_user_id');
      
      const response = await fetch(`/api/v1/orders/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      }
    } catch (e) {
      toast.error("Failed to sync with archive.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const userId = localStorage.getItem('anubhuti_user_id');
    if (!userId) return;

    // Subscribe to realtime updates for this user's orders
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Re-fetch to ensure we get the full updated timeline (order_status_history)
          fetchOrders();
          if (payload.eventType === 'UPDATE') {
             toast.info(`Order status updated to: ${payload.new.status}`, {
               style: { background: '#0A0A0A', color: '#C5A059', border: '1px solid rgba(197, 160, 89, 0.2)' }
             });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'PAYMENT_CAPTURED': return 'bg-green-50 text-green-600 border-green-200';
      case 'PROCESSING': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'SHIPPED': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] py-32 px-6">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="text-center space-y-4">
          <SutraKnot className="w-8 h-8 mx-auto text-primary/20" />
          <h1 className="text-4xl serif font-light">Your Intentions</h1>
        </header>

        <div className="space-y-8">
          {orders.length === 0 ? (
            <div className="text-center py-20 space-y-8">
              <p className="text-sm text-muted-foreground italic">Archive is currently empty.</p>
              <Link to="/archive">
                <Button variant="outline" className="rounded-none uppercase tracking-widest text-[10px]">Explore Archive</Button>
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <motion.div 
                key={order.id}
                className="bg-white p-8 border border-primary/5 space-y-8 relative overflow-hidden shadow-sm"
              >
                <div className="flex justify-between items-center border-b border-primary/5 pb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ID: {order.id}</p>
                    <p className="text-sm serif mt-1">Settled on {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border ${getStatusBadgeColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-4">
                  {JSON.parse(order.items || '[]').map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <p className="serif">{item.skuId} <span className="text-[10px] text-muted-foreground ml-2">x{item.qty}</span></p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-primary/5 flex justify-between items-end">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Investment</p>
                  <p className="text-xl serif">₹{(order.total_amount_paise / 100).toLocaleString()}</p>
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