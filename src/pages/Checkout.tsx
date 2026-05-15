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
  ShieldCheck, CreditCard, Lock, Fingerprint, Loader2, CheckCircle2, 
  ChevronRight, Server, MapPin, Search, Smartphone, Landmark,
  Wallet, ChevronLeft
} from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | null>(null);
  const [shipping, setShipping] = useState({ name: '', email: '', address: '', landmark: '', city: '', zip: '' });
  const [card, setCard] = useState({ pan: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [otp, setOtp] = useState('');
  const [fraudLogs, setFraudLogs] = useState<string[]>([]);
  
  const fraudIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const fraudTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const finalizeOrder = () => {
    toast.success("Payment captured. Order logged.");
    setTimeout(() => {
      const order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toLocaleDateString(),
        items: cart,
        total: total,
        status: 'CONFIRMED',
        shipping: shipping,
        method: paymentMethod?.toUpperCase()
      };
      const existing = JSON.parse(localStorage.getItem('anubhuti_orders') || '[]');
      localStorage.setItem('anubhuti_orders', JSON.stringify([order, ...existing]));
      clearCart();
      setPhase(5);
    }, 1000);
  };

  const runFraudEngine = () => {
    setPhase(4);
    const logs = ["Velocity checks... [PASS]", "Device ID match... [SAFE]", "Geo-IP check... [VALID]", "Risk score: 0.02 [LOW]"];
    let i = 0;
    fraudIntervalRef.current = setInterval(() => {
      if (i < logs.length) {
        setFraudLogs(prev => [...prev, logs[i]!]);
        i++;
      } else {
        clearInterval(fraudIntervalRef.current!);
        finalizeOrder();
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] py-32 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Progress Bar */}
        <div className="flex justify-center mb-16 space-x-8 text-[9px] uppercase tracking-widest text-muted-foreground overflow-x-auto whitespace-nowrap">
          <span className={phase >= 1 ? "text-primary font-bold" : ""}>1. Transit</span>
          <span className={phase >= 2 ? "text-primary font-bold" : ""}>2. Payment Method</span>
          <span className={phase >= 3 ? "text-primary font-bold" : ""}>3. Auth</span>
          <span className={phase >= 4 ? "text-primary font-bold" : ""}>4. Settlement</span>
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
                      <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest">Name</Label><Input required value={shipping.name} onChange={e => setShipping({...shipping, name: e.target.value})} className="bg-transparent border-primary/10 rounded-none" /></div>
                      <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest">Email</Label><Input type="email" required value={shipping.email} onChange={e => setShipping({...shipping, email: e.target.value})} className="bg-transparent border-primary/10 rounded-none" /></div>
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
                    <Button type="submit" className="w-full bg-primary text-white rounded-none h-16 text-[10px] uppercase tracking-[0.5em] font-bold">Proceed to Payment</Button>
                  </form>
                </motion.div>
              )}

              {/* PHASE 2: PAYMENT METHOD SELECTION */}
              {phase === 2 && !paymentMethod && (
                <motion.div key="p2-select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                  <header className="space-y-2">
                    <h1 className="text-4xl serif font-light">Select Method</h1>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Supported by Razorpay Secure</p>
                  </header>
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => setPaymentMethod('upi')} className="flex items-center justify-between p-8 border border-primary/10 hover:border-primary/40 hover:bg-white transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-primary/5 flex items-center justify-center rounded-full"><Smartphone size={20} /></div>
                        <div className="text-left">
                          <p className="text-sm serif font-bold">UPI (GPay / PhonePe / Paytm)</p>
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Instant settlement via VPA</p>
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => setPaymentMethod('card')} className="flex items-center justify-between p-8 border border-primary/10 hover:border-primary/40 hover:bg-white transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-primary/5 flex items-center justify-center rounded-full"><CreditCard size={20} /></div>
                        <div className="text-left">
                          <p className="text-sm serif font-bold">Cards (Credit / Debit)</p>
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Visa, Mastercard, AMEX, RuPay</p>
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => setPaymentMethod('netbanking')} className="flex items-center justify-between p-8 border border-primary/10 hover:border-primary/40 hover:bg-white transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-primary/5 flex items-center justify-center rounded-full"><Landmark size={20} /></div>
                        <div className="text-left">
                          <p className="text-sm serif font-bold">Netbanking</p>
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">All major Indian banks</p>
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                  <button onClick={() => setPhase(1)} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground hover:text-primary"><ChevronLeft size={12} /> Back to Shipping</button>
                </motion.div>
              )}

              {/* PHASE 2.1: UPI FLOW */}
              {phase === 2 && paymentMethod === 'upi' && (
                <motion.div key="p2-upi" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                   <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground mb-8"><ChevronLeft size={12} /> Change Payment Method</button>
                   <header className="space-y-2">
                    <h2 className="text-3xl serif font-light">UPI Transaction</h2>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pay using GPay, PhonePe or any UPI app</p>
                  </header>
                  <div className="space-y-8 bg-white p-8 border border-primary/5">
                    <div className="flex justify-center gap-8 opacity-60">
                      <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-gray-50 flex items-center justify-center border border-gray-100"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="w-8 h-8" alt="GPay" /></div><span className="text-[8px] tracking-widest uppercase">GPay</span></div>
                      <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-gray-50 flex items-center justify-center border border-gray-100"><img src="https://img.icons8.com/color/48/phone-pe.png" className="w-8 h-8" alt="PhonePe" /></div><span className="text-[8px] tracking-widest uppercase">PhonePe</span></div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Virtual Payment Address (VPA)</Label>
                      <Input placeholder="username@okicici" value={upiId} onChange={e => setUpiId(e.target.value)} className="bg-transparent border-primary/10 rounded-none text-center text-xl h-14" />
                      <Button onClick={runFraudEngine} disabled={!upiId.includes('@')} className="w-full bg-[#5F259F] text-white rounded-none h-14 text-[10px] uppercase tracking-widest font-bold">Verify & Pay</Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE 2.2: CARD FLOW (AMEX SUPPORTED) */}
              {phase === 2 && paymentMethod === 'card' && (
                <motion.div key="p2-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground mb-8"><ChevronLeft size={12} /> Change Payment Method</button>
                  <header className="space-y-2">
                    <h2 className="text-3xl serif font-light">Card Authorization</h2>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">PCI-DSS Tokenized Gateway</p>
                  </header>
                  <div className="space-y-8">
                    {/* Dynamic Card Display */}
                    <div className={`w-full h-56 rounded-xl p-8 relative overflow-hidden shadow-2xl transition-all duration-700 ${card.pan.startsWith('3') ? 'bg-gradient-to-br from-[#006fcf] to-[#00345d]' : 'bg-gradient-to-br from-[#072654] to-[#3395FF]'}`}>
                       <div className="flex justify-between items-start mb-12">
                          <CreditCard className="text-white/80" />
                          {card.pan.startsWith('3') ? (
                            <div className="bg-white px-2 py-1 rounded-sm"><span className="text-[10px] font-black text-[#006fcf] tracking-tighter">AMERICAN EXPRESS</span></div>
                          ) : (
                            <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-white rounded-full opacity-40" /><div className="w-4 h-4 bg-white rounded-full -ml-2" /></div>
                          )}
                       </div>
                       <div className="space-y-6">
                          <Input placeholder="CARD NUMBER" value={card.pan} onChange={e => setCard({...card, pan: e.target.value})} className="bg-transparent border-none p-0 text-white font-mono text-xl tracking-[0.2em] focus-visible:ring-0 shadow-none h-fit" maxLength={16} />
                          <div className="flex gap-12">
                            <Input placeholder="MM/YY" value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} className="bg-transparent border-none p-0 text-white font-mono text-sm tracking-widest focus-visible:ring-0 shadow-none w-16 h-fit" maxLength={5} />
                            <Input placeholder="CVV" type="password" value={card.cvv} onChange={e => setCard({...card, cvv: e.target.value})} className="bg-transparent border-none p-0 text-white font-mono text-sm tracking-widest focus-visible:ring-0 shadow-none w-12 h-fit" maxLength={4} />
                          </div>
                       </div>
                    </div>
                    <Button onClick={() => setPhase(3)} disabled={card.pan.length < 15} className="w-full bg-[#3395FF] text-white rounded-none h-14 text-[10px] uppercase tracking-widest font-bold">Finalize with 3-D Secure</Button>
                  </div>
                </motion.div>
              )}

              {/* PHASE 2.3: NETBANKING FLOW */}
              {phase === 2 && paymentMethod === 'netbanking' && (
                <motion.div key="p2-bank" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground mb-8"><ChevronLeft size={12} /> Change Payment Method</button>
                  <header className="space-y-2">
                    <h2 className="text-3xl serif font-light">Bank Redirect</h2>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Select your primary financial institution</p>
                  </header>
                  <div className="grid grid-cols-2 gap-4">
                    {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'KOTAK', 'Yes Bank'].map(bank => (
                      <button key={bank} onClick={runFraudEngine} className="p-6 border border-primary/5 hover:border-primary/20 hover:bg-white text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">{bank}</button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* PHASE 3: OTP */}
              {phase === 3 && (
                <motion.div key="p3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-12">
                   <div className="p-12 bg-white border border-blue-50 space-y-8 max-w-sm">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 bg-[#3395FF] rounded-sm" /><span className="font-bold tracking-widest text-[#072654]">RAZORPAY</span>
                      </div>
                      <h3 className="text-xl serif">Identity Verification</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Enter the 6-digit code sent to your banking device for secure settlement.</p>
                      <Input placeholder="OTP" value={otp} onChange={e => setOtp(e.target.value)} className="text-center text-2xl h-14 bg-gray-50" maxLength={6} />
                      <Button onClick={runFraudEngine} className="w-full bg-[#3395FF] text-white rounded-none h-12 uppercase tracking-widest text-xs font-bold">Confirm Payment</Button>
                   </div>
                </motion.div>
              )}

              {/* PHASE 4: FRAUD ENGINE */}
              {phase === 4 && (
                <motion.div key="p4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 py-12">
                   <div className="bg-black text-green-400 font-mono p-12 space-y-4 rounded-sm shadow-2xl relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-8 border-b border-green-900 pb-4">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="text-[10px] uppercase tracking-widest">Distributed Ledger Settlement</span>
                      </div>
                      {fraudLogs.map((log, i) => (
                        <div key={i} className="text-[11px] uppercase tracking-widest opacity-80">{`> ${log}`}</div>
                      ))}
                      <div className="absolute bottom-0 left-0 h-1 bg-green-500 w-full animate-pulse" />
                   </div>
                </motion.div>
              )}

              {/* PHASE 5: SUCCESS */}
              {phase === 5 && (
                <motion.div key="p5" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-12 flex flex-col items-center justify-center min-h-[400px]">
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
               <span>Secured by Razorpay PCI-DSS Level 1</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;