"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, CreditCard, Lock, Loader2, CheckCircle2, 
  MapPin, Search, ChevronLeft, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useRazorpay } from '@/hooks/useRazorpay';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapController = ({ center, onLocationSelect }: { center: [number, number], onLocationSelect: (lat: number, lng: number) => void }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);

  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// ⚠️ YOUR RAZORPAY TEST KEY ID 
// Get this from: Dashboard -> Settings -> API Keys
const RAZORPAY_KEY_ID = "rzp_test_YourActualKeyHere"; 

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  const isRzpReady = useRazorpay();
  
  const [phase, setPhase] = useState(1);
  const [shipping, setShipping] = useState({ name: '', email: '', address: '', landmark: '', city: '', zip: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setShipping(prev => ({ ...prev, address: data.display_name }));
        toast.success("Address updated from map.");
      }
    } catch (e) {
      toast.error("Could not fetch address details.");
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    fetchAddressFromCoords(lat, lng);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      toast.info("Locating you...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter([lat, lng]);
          setMarkerPos([lat, lng]);
          fetchAddressFromCoords(lat, lng);
        },
        () => toast.error("Unable to retrieve location."),
        { enableHighAccuracy: true }
      );
    }
  };

  const handleSearchMap = async () => {
    if (searchInput.trim()) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setMapCenter([lat, lng]);
          setMarkerPos([lat, lng]);
          setShipping(prev => ({ ...prev, address: data[0].display_name }));
        }
      } catch (e) {
        toast.error("Search failed.");
      }
    }
  };

  const handlePayment = () => {
    if (!isRzpReady) {
      toast.error("Razorpay SDK is still loading...");
      return;
    }

    if (RAZORPAY_KEY_ID === "rzp_test_YourActualKeyHere") {
      toast.error("Please update RAZORPAY_KEY_ID in the code to your actual test key.");
      return;
    }

    setIsProcessing(true);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: total * 100, // Amount in paise
      currency: "INR",
      name: "ANUBHUTI ARCHIVE",
      description: "Sacred Selection Purchase",
      image: "https://svjnrkzeqgqxcrjrrmcg.supabase.co/storage/v1/object/public/assets/logo-gold.png",
      handler: function (response: any) {
        // This is called on SUCCESS
        toast.success(`Payment Successful: ${response.razorpay_payment_id}`);
        const order = {
          id: `ANB-${response.razorpay_payment_id.slice(-6).toUpperCase()}`,
          date: new Date().toLocaleDateString(),
          items: cart,
          total: total,
          status: 'CONFIRMED',
          shipping: shipping,
          paymentId: response.razorpay_payment_id
        };
        const existing = JSON.parse(localStorage.getItem('anubhuti_orders') || '[]');
        localStorage.setItem('anubhuti_orders', JSON.stringify([order, ...existing]));
        clearCart();
        setPhase(3); // Go to success screen
        setIsProcessing(false);
      },
      prefill: {
        name: shipping.name,
        email: shipping.email,
        contact: "9999999999"
      },
      notes: {
        address: shipping.address
      },
      theme: {
        color: "#0A0A0A"
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] py-32 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Progress Bar */}
        <div className="flex justify-center mb-16 space-x-8 text-[9px] uppercase tracking-widest text-muted-foreground border-b border-primary/5 pb-8">
          <span className={phase >= 1 ? "text-primary font-bold" : ""}>1. Transit</span>
          <span className={phase >= 2 ? "text-primary font-bold" : ""}>2. Settlement</span>
          <span className={phase >= 3 ? "text-primary font-bold" : ""}>3. Manifested</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
              
              {/* PHASE 1: SHIPPING */}
              {phase === 1 && (
                <motion.div key="p1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                  <header className="space-y-2">
                    <h1 className="text-4xl serif font-light">Transit Details</h1>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Specify your receiving coordinates</p>
                  </header>
                  <form onSubmit={(e) => { e.preventDefault(); setPhase(2); }} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest">Name</Label><Input required value={shipping.name} onChange={e => setShipping({...shipping, name: e.target.value})} className="bg-transparent border-primary/10 rounded-none h-12" /></div>
                      <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest">Email</Label><Input type="email" required value={shipping.email} onChange={e => setShipping({...shipping, email: e.target.value})} className="bg-transparent border-primary/10 rounded-none h-12" /></div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input placeholder="Search map..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="bg-transparent border-primary/10 rounded-none h-10" />
                        <Button type="button" onClick={handleSearchMap} className="bg-primary/5 rounded-none h-10 text-[9px] px-4">SEARCH</Button>
                        <Button type="button" onClick={handleLocateMe} className="bg-[#C5A059] text-black rounded-none h-10 text-[9px] px-4 font-bold">LOCATE ME</Button>
                      </div>
                      <div className="h-64 border border-primary/10 grayscale hover:grayscale-0 transition-all z-0">
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%' }}>
                          <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
                          {markerPos && <Marker position={markerPos} />}
                          <MapController center={mapCenter} onLocationSelect={handleMapClick} />
                        </MapContainer>
                      </div>
                      <Input required placeholder="Address Line 1" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} className="bg-transparent border-primary/10 rounded-none h-12" />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-white rounded-none h-16 text-[10px] uppercase tracking-[0.5em] font-bold">Review Settlement</Button>
                  </form>
                </motion.div>
              )}

              {/* PHASE 2: REVIEW & TRIGGER RAZORPAY */}
              {phase === 2 && (
                <motion.div key="p2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                   <button onClick={() => setPhase(1)} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground mb-8"><ChevronLeft size={12} /> Back to Shipping</button>
                   <header className="space-y-2">
                    <h2 className="text-4xl serif font-light">Review & Pay</h2>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Secure Settlement via Razorpay Gateway</p>
                  </header>
                  
                  <div className="bg-white p-12 border border-primary/5 space-y-8">
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Shipping To</span>
                        <p className="text-sm serif leading-relaxed">{shipping.name}<br/>{shipping.address}</p>
                    </div>

                    <div className="p-6 bg-primary/5 border border-primary/10 flex items-start gap-4">
                        <Info size={16} className="text-[#C5A059] shrink-0 mt-0.5" />
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-relaxed">
                            Clicking the button below will open the secure Razorpay modal. You can use your test credentials to simulate UPI, Cards, or Netbanking.
                        </p>
                    </div>

                    <Button 
                        onClick={handlePayment} 
                        disabled={isProcessing || !isRzpReady}
                        className="w-full bg-[#0A0A0A] text-white rounded-none h-16 text-[10px] uppercase tracking-[0.5em] font-bold relative overflow-hidden"
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-3"><Loader2 className="animate-spin" size={16} /> Opening Gateway...</span>
                        ) : (
                            "Initiate Secure Payment"
                        )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* PHASE 3: SUCCESS */}
              {phase === 3 && (
                <motion.div key="p3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-12 flex flex-col items-center justify-center min-h-[400px]">
                   <CheckCircle2 className="w-24 h-24 text-green-600" />
                   <h2 className="text-4xl serif">Order Manifested</h2>
                   <div className="space-y-4">
                      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Settlement complete via Razorpay</p>
                      <Button onClick={() => navigate('/orders')} className="bg-primary text-white rounded-none px-12 py-6 text-[10px] uppercase tracking-[0.4em] font-bold">Review My Orders</Button>
                   </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="bg-white/40 p-12 h-fit border border-primary/5 space-y-12">
            <h2 className="text-2xl serif font-light">The Selection</h2>
            <div className="space-y-8">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <p className="serif">{item.name} <span className="text-[10px] text-muted-foreground ml-2">x{item.quantity}</span></p>
                  <span>₹{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-primary/10 pt-8 flex justify-between items-end">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total Investment</span>
              <span className="text-3xl serif">₹{total.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest text-muted-foreground pt-12 border-t border-primary/10">
               <ShieldCheck size={14} className="text-green-700" />
               <span>Official Razorpay PCI-DSS SDK</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;