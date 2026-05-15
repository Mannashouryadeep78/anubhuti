"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SutraKnot } from '@/components/SutraKnot';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CreditCard, Lock, Fingerprint, Loader2, CheckCircle2, ChevronRight, Server, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';

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

// Map controller component to handle centering and clicks
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

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState(1);
  const [shipping, setShipping] = useState({ name: '', email: '', address: '', landmark: '', city: '', zip: '' });
  const [card, setCard] = useState({ pan: '', expiry: '', cvv: '' });
  const [otp, setOtp] = useState('');
  const [fraudLogs, setFraudLogs] = useState<string[]>([]);
  const fraudIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const fraudTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (fraudIntervalRef.current) clearInterval(fraudIntervalRef.current);
      if (fraudTimeoutRef.current) clearTimeout(fraudTimeoutRef.current);
    };
  }, []);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [searchInput, setSearchInput] = useState('');

  // Reverse geocoding
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
      toast.info("Locating you (requesting high accuracy)...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter([lat, lng]);
          setMarkerPos([lat, lng]);
          fetchAddressFromCoords(lat, lng);
        },
        () => {
          toast.error("Unable to retrieve your location.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  const handleSearchMap = async () => {
    if (searchInput.trim()) {
      toast.info("Searching...");
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setMapCenter([lat, lng]);
          setMarkerPos([lat, lng]);
          setShipping(prev => ({ ...prev, address: data[0].display_name }));
          toast.success("Location found.");
        } else {
          toast.error("Location not found.");
        }
      } catch (e) {
        toast.error("Search failed.");
      }
    }
  };

  if (cart.length === 0 && phase === 1) {
    return (
      <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center p-6">
        <p className="text-xl serif mb-8">Your selection is empty.</p>
        <Button onClick={() => navigate('/archive')} variant="outline" className="rounded-none uppercase tracking-widest text-[10px]">Return to Archive</Button>
      </div>
    );
  }

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Inventory locked & Price validated (Phase 3).");
    setPhase(2);
  };

  const handleStartPaymentProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card.pan || !card.expiry || !card.cvv) return;
    
    setPhase(3);
    toast.info("Card tokenized into PCI-DSS vault. Raw PAN removed.", { icon: <Server className="w-4 h-4" /> });
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    
    setPhase(4);
    runFraudEngine();
  };

  const runFraudEngine = () => {
    const logs = [
      "Running Velocity checks... [PASS]",
      "Analyzing Device fingerprint... [MATCH]",
      "Verifying Geo-IP... [SAFE]",
      "Checking CVV2 & AVS... [MATCH]",
      "Behavioral ML Risk Assessment... [LOW RISK]"
    ];

    let currentLog = 0;
    fraudIntervalRef.current = setInterval(() => {
      if (currentLog < logs.length) {
        const entry = logs[currentLog];
        if (entry !== undefined) {
          setFraudLogs(prev => [...prev, entry]);
        }
        currentLog++;
      } else {
        if (fraudIntervalRef.current) clearInterval(fraudIntervalRef.current);
        fraudTimeoutRef.current = setTimeout(() => finalizeOrder(), 1500);
      }
    }, 800);
  };

  const finalizeOrder = () => {
    toast.success("Razorpay payment captured. Funds secured.", { duration: 3000 });
    setTimeout(() => {
      const order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toLocaleDateString(),
        items: cart,
        total: total,
        status: 'CONFIRMED',
        shipping: shipping
      };

      try {
        const raw = localStorage.getItem('anubhuti_orders');
        const existingOrders = raw ? JSON.parse(raw) : [];
        const safeExisting = Array.isArray(existingOrders) ? existingOrders : [];
        localStorage.setItem('anubhuti_orders', JSON.stringify([order, ...safeExisting]));
      } catch (e) {
        localStorage.setItem('anubhuti_orders', JSON.stringify([order]));
      }

      clearCart();
      setPhase(5);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] py-32 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Phase Indicators */}
        <div className="flex justify-center mb-16 space-x-4 md:space-x-8 text-[9px] uppercase tracking-widest text-muted-foreground">
          <span className={phase >= 1 ? "text-primary font-bold" : ""}>1. Identity</span>
          <span className={phase >= 2 ? "text-primary font-bold" : ""}>2. Tokenization</span>
          <span className={phase >= 3 ? "text-primary font-bold" : ""}>3. 3-D Secure</span>
          <span className={phase >= 4 ? "text-primary font-bold" : ""}>4. Fraud / Auth</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Dynamic Left Column */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {/* PHASE 1: IDENTITY & SHIPPING */}
              {phase === 1 && (
                <motion.div key="phase1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 w-full">
                  <header className="space-y-4">
                    <h1 className="text-4xl serif font-light">Identity & Transit</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Phases 1-3: Order Creation & Inventory Lock</p>
                  </header>

                  <form onSubmit={handleProceedToPayment} className="space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest">Full Name (OAuth2/Guest)</Label>
                        <Input required value={shipping.name} onChange={e => setShipping({...shipping, name: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest">Email Address</Label>
                        <Input type="email" required value={shipping.email} onChange={e => setShipping({...shipping, email: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase tracking-widest">Delivery Location</Label>
                        
                        <div className="flex gap-2">
                          <div className="relative flex-grow">
                            <Input 
                              placeholder="Search location..." 
                              value={searchInput} 
                              onChange={e => setSearchInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchMap())}
                              className="bg-transparent border-primary/10 focus:border-primary rounded-none h-10 pl-10 text-sm" 
                            />
                            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                          </div>
                          <Button type="button" onClick={handleSearchMap} className="rounded-none bg-primary/10 text-primary hover:bg-primary/20 h-10 px-4 text-[10px] uppercase tracking-widest">
                            Search
                          </Button>
                          <Button type="button" onClick={handleLocateMe} className="rounded-none bg-[#C5A059] text-black hover:bg-[#D4AF37] h-10 px-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="hidden sm:inline text-[10px] uppercase tracking-widest font-bold">Locate Me</span>
                          </Button>
                        </div>

                        <div className="w-full h-64 bg-gray-100 border border-primary/10 relative overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 z-0">
                          <MapContainer key="leaflet-map" center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                            {/* Using Google Maps Tiles for visual fidelity without an API key */}
                            <TileLayer
                              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                              attribution="&copy; Google Maps"
                            />
                            {markerPos && <Marker position={markerPos} />}
                            <MapController center={mapCenter} onLocationSelect={handleMapClick} />
                          </MapContainer>
                        </div>
                        <div className="space-y-2 pt-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Complete Address Details</Label>
                          <Input required placeholder="Apartment, suite, etc." value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
                        </div>
                        <div className="space-y-2 pt-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Landmark (Optional)</Label>
                          <Input placeholder="e.g. Near Apollo Hospital" value={shipping.landmark} onChange={e => setShipping({...shipping, landmark: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest">City</Label>
                          <Input required value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest">ZIP Code</Label>
                          <Input required value={shipping.zip} onChange={e => setShipping({...shipping, zip: e.target.value})} className="bg-transparent border-primary/10 focus:border-primary rounded-none h-12" />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-none h-16 text-[10px] uppercase tracking-[0.5em] font-bold group">
                      Proceed to Secure Payment
                      <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* PHASE 2: PAYMENT ENTRY (RAZORPAY) */}
              {phase === 2 && (
                <motion.div key="phase2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 w-full">
                  <header className="space-y-4">
                    <h1 className="text-4xl serif font-light flex items-center gap-4">
                      <ShieldCheck className="text-green-700" />
                      Secure Payment
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Phase 2: Razorpay PCI-DSS Vault</p>
                  </header>

                  <form onSubmit={handleStartPaymentProcess} className="space-y-8">
                    {/* RAZORPAY CARD UI */}
                    <div className="w-full h-56 bg-gradient-to-br from-[#072654] to-[#3395FF] rounded-xl p-8 relative overflow-hidden shadow-2xl border border-blue-900">
                      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)' }}></div>
                      <div className="flex justify-between items-start mb-8 relative z-10">
                        <CreditCard className="w-8 h-8 text-white/80" />
                        {/* Razorpay wordmark */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-[#3395FF] rounded-sm" />
                          </div>
                          <span className="text-[11px] font-bold tracking-widest text-white">RAZORPAY</span>
                        </div>
                      </div>

                      <div className="space-y-4 relative z-10">
                        <Input required placeholder="Card Number (PAN)" value={card.pan} onChange={e => setCard({...card, pan: e.target.value})} className="bg-transparent border-b border-white/40 focus:border-white rounded-none h-10 text-white font-mono text-lg tracking-widest placeholder:text-white/30 px-0 outline-none shadow-none ring-0 focus-visible:ring-0" maxLength={19} />
                        <div className="flex gap-8">
                          <Input required placeholder="MM/YY" value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} className="bg-transparent border-b border-white/40 focus:border-white rounded-none h-10 text-white font-mono text-sm tracking-widest placeholder:text-white/30 w-24 px-0 outline-none shadow-none ring-0 focus-visible:ring-0" maxLength={5} />
                          <Input required placeholder="CVV" value={card.cvv} onChange={e => setCard({...card, cvv: e.target.value})} className="bg-transparent border-b border-white/40 focus:border-white rounded-none h-10 text-white font-mono text-sm tracking-widest placeholder:text-white/30 w-16 px-0 outline-none shadow-none ring-0 focus-visible:ring-0" maxLength={4} type="password" />
                        </div>
                      </div>
                      <div className="absolute bottom-5 right-8 text-white/20 text-[10px] font-bold uppercase tracking-widest">Secured Vault</div>
                    </div>

                    <Button type="submit" className="w-full bg-[#3395FF] hover:bg-[#2276D9] text-white rounded-none h-16 text-[10px] uppercase tracking-[0.5em] font-bold flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />
                      Pay Securely with Razorpay
                    </Button>
                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      256-bit SSL · PCI DSS Level 1 · Raw PAN never stored
                    </p>
                  </form>
                </motion.div>
              )}

              {/* PHASE 3: RAZORPAY OTP VERIFICATION */}
              {phase === 3 && (
                <motion.div key="phase3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex flex-col items-center justify-center min-h-[400px] space-y-8 w-full">
                  <div className="bg-white p-12 shadow-2xl border border-blue-100 max-w-sm w-full text-center space-y-8">
                    {/* Razorpay logo */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-[#3395FF] rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm" />
                      </div>
                      <span className="text-lg font-bold tracking-widest text-[#072654]">RAZORPAY</span>
                    </div>
                    <Fingerprint className="w-14 h-14 mx-auto text-[#3395FF]" />
                    <div className="space-y-2">
                      <h2 className="text-2xl serif font-bold text-[#072654]">Razorpay Secure OTP</h2>
                      <p className="text-xs text-muted-foreground">3-D Secure 2.0 · SMS / Email Challenge</p>
                    </div>
                    <p className="text-sm text-gray-600">Please enter the One-Time Password sent to your registered mobile number to verify your identity.</p>

                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                      <Input required placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} className="text-center text-2xl tracking-[0.5em] h-14 bg-gray-50 border-[#3395FF]/30 focus:border-[#3395FF]" maxLength={6} />
                      <Button type="submit" className="w-full bg-[#3395FF] hover:bg-[#2276D9] text-white rounded-none h-12 uppercase tracking-widest text-xs font-bold">
                        Verify & Pay
                      </Button>
                    </form>
                    <p className="text-[10px] text-gray-400">Secured by Razorpay · PCI DSS Level 1</p>
                  </div>
                </motion.div>
              )}

              {/* PHASE 4: FRAUD ENGINE & AUTH */}
              {phase === 4 && (
                <motion.div key="phase4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-[400px] space-y-8 justify-center w-full">
                  <div className="bg-black text-green-400 font-mono p-8 rounded-lg shadow-2xl space-y-4 h-80 overflow-hidden relative">
                    <div className="flex items-center gap-3 mb-6 border-b border-green-900 pb-4">
                      <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                      <span className="uppercase tracking-widest text-xs font-bold text-white">Fraud Detection Engine</span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {fraudLogs.map((log, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                          <span className="text-gray-500">{`[${new Date().toISOString().split('T')[1].substring(0,8)}]`}</span>
                          <span className={log?.includes('LOW RISK') ? 'text-blue-400 font-bold' : ''}>{log ?? ''}</span>
                        </motion.div>
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-green-900/30">
                      <motion.div className="h-full bg-green-500" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 4, ease: "linear" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE 5: SUCCESS */}
              {phase === 5 && (
                <motion.div key="phase5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[400px] space-y-8 w-full text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                    <CheckCircle2 className="w-32 h-32 text-green-600 mx-auto" />
                  </motion.div>
                  <h2 className="text-4xl serif">Order Confirmed</h2>
                  <div className="space-y-2 text-sm uppercase tracking-widest text-muted-foreground">
                    <p>Phase 5: Payment Captured</p>
                    <p>Settled via Razorpay</p>
                    <p>Event logged to Kafka</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button
                      onClick={() => navigate('/orders')}
                      className="bg-primary text-primary-foreground rounded-none h-14 px-8 text-[10px] uppercase tracking-[0.4em] font-bold"
                    >
                      View My Orders
                    </Button>
                    <Button
                      onClick={() => navigate('/archive')}
                      variant="outline"
                      className="rounded-none h-14 px-8 text-[10px] uppercase tracking-[0.4em]"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Static Right Column - Order Summary */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/50 p-12 space-y-12 h-fit border border-primary/5">
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
            
            {/* Audit Log Indicator */}
            <div className="pt-8 border-t border-primary/10 text-[9px] uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-center gap-2">
               <Server className="w-3 h-3" />
               <span>Immutable Audit Log Active</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;