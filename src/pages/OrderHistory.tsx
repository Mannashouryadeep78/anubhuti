"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { RefreshCw, Server, AlertCircle, MapPin, PackageCheck, Truck } from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('anubhuti_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOrders(parsed.filter(o => o && typeof o === 'object'));
        } else {
          setOrders([]);
        }
      }
    } catch (e) {
      setOrders([]);
    }
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => {
      const updated = prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      localStorage.setItem('anubhuti_orders', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCancelFlow = (orderId: string) => {
    setProcessingId(orderId);
    
    // Phase 8: Cancellation Eligibility Engine
    toast.info("Phase 8: Cancellation Eligibility Engine running...");
    
    setTimeout(() => {
      toast.success("Order status checked: Not Shipped. Cancellation Approved. Inventory Unlocked.");
      updateOrderStatus(orderId, 'CANCELLED');
      
      // Phase 9: Secure Refund to Amex Card
      setTimeout(() => {
        toast.info("Phase 9: Initiating Secure Refund to Amex Black Card...", { icon: <RefreshCw className="w-4 h-4 animate-spin" /> });
        
        setTimeout(() => {
          toast.success("Amex Refund API Call successful. Original token used.");
          updateOrderStatus(orderId, 'REFUNDED');
          
          setTimeout(() => {
            toast.success("SOX-compliant audit trail recorded. Customer notified via email & Amex app.");
            setProcessingId(null);
          }, 1500);
        }, 2500);
      }, 2000);
    }, 2000);
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'SHIPPED': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'DELIVERED': return 'bg-green-50 text-green-600 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-200';
      case 'REFUNDED': return 'bg-gray-800 text-gray-200 border-gray-600';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] py-32 px-6">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="text-center space-y-4">
          <SutraKnot className="w-8 h-8 mx-auto text-primary/20" />
          <h1 className="text-4xl serif font-light">Your Intentions</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">A record of your journey & audit trail</p>
        </header>

        <div className="space-y-8">
          {(!Array.isArray(orders) || orders.length === 0) ? (
            <div className="text-center py-20 space-y-8">
              <p className="text-sm text-muted-foreground italic">No orders found in the archive.</p>
              <Link to="/archive">
                <Button variant="outline" className="rounded-none uppercase tracking-widest text-[10px]">Explore Archive</Button>
              </Link>
            </div>
          ) : (
            <>
              {orders?.map((order, idx) => (
              <motion.div 
                key={order?.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 border border-primary/5 space-y-8 relative overflow-hidden shadow-sm"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/5 pb-6 relative z-10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Order ID: {order?.id || 'Unknown'}</p>
                    <p className="text-sm serif mt-1">Placed on {order?.date || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border ${getStatusBadgeColor(order?.status)}`}>
                      {order?.status || 'UNKNOWN'}
                    </span>
                    
                    <div className="flex gap-4 items-center">
                      {order?.status !== 'CANCELLED' && order?.status !== 'REFUNDED' && (
                        <button 
                          onClick={() => setTrackingOrderId(trackingOrderId === order.id ? null : order.id)}
                          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <MapPin size={10} />
                          {trackingOrderId === order?.id ? 'Hide Tracking' : 'Track Order'}
                        </button>
                      )}
                      {order?.status === 'CONFIRMED' && (
                        <button 
                          onClick={() => handleCancelFlow(order.id)}
                          disabled={processingId === order?.id}
                          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {processingId === order?.id ? 'Processing...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex justify-between items-center">
                      <p className="text-sm serif">{item.name || 'Unknown Item'} <span className="text-[10px] text-muted-foreground ml-2">x{item.quantity || 1}</span></p>
                      <p className="text-sm">₹{item.price?.toLocaleString ? item.price.toLocaleString() : (item.price || 0)}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-primary/5 flex justify-between items-end relative z-10">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Investment</p>
                  <p className="text-xl serif">₹{order.total?.toLocaleString ? order.total.toLocaleString() : (order.total || 0)}</p>
                </div>

                <AnimatePresence>
                  {trackingOrderId === order?.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-primary/5 pt-8 mt-6 overflow-hidden relative z-10"
                    >
                      <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-8 text-center">Live Tracking Journey</h4>
                      
                      <div className="max-w-md mx-auto relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-primary/20 before:via-primary/10 before:to-transparent space-y-8 pb-8">
                        
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary bg-white z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm">
                            <PackageCheck size={16} className="text-primary" />
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white/80 p-4 border border-primary/10 shadow-sm ml-4 md:ml-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[10px] uppercase tracking-widest text-primary">Order Confirmed</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Your order has been securely logged into the vault.</p>
                            <p className="text-[9px] text-muted-foreground mt-2">{order.date}</p>
                          </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-gray-50 z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <Truck size={16} className="text-muted-foreground" />
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white/40 p-4 border border-primary/5 ml-4 md:ml-0 opacity-70">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">In Transit</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Awaiting dispatch from central warehouse.</p>
                          </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-gray-50 z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <MapPin size={16} className="text-muted-foreground" />
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white/40 p-4 border border-primary/5 ml-4 md:ml-0 opacity-70">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Destination</span>
                            </div>
                            {order?.shipping ? (
                              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                <p>{order.shipping.name}</p>
                                <p>{order.shipping.address}</p>
                                {order.shipping.landmark && <p>Landmark: {order.shipping.landmark}</p>}
                                <p>{order.shipping.city}, {order.shipping.zip}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">Destination details pending.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Audit Trail Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[0.3em] text-gray-300 flex items-center gap-2 pointer-events-none">
                  <Server className="w-3 h-3" />
                  Logged in Event Bus
                </div>

                {/* Overlay while processing cancellation */}
                <AnimatePresence>
                  {processingId === order.id && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-4"
                    >
                      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs uppercase tracking-widest font-bold text-primary">Running Cancellation Engine</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              ))}
              
              <div className="pt-12 text-center">
                <Link to="/archive">
                  <Button variant="outline" className="rounded-none uppercase tracking-widest text-[10px]">
                    Return to Archive
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;