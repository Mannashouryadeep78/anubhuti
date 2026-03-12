"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLoginModal from './AdminLoginModal';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <>
      <nav className="w-full bg-black text-white py-6 px-6 md:px-12 flex items-center justify-between z-50 relative border-b border-white/5">
        {/* Desktop Left Side Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            to="/ledger" 
            className="text-[11px] font-bold tracking-[0.2em] hover:text-[#C5A059] transition-colors uppercase"
          >
            About
          </Link>
          <Link 
            to="/archive" 
            className="text-[11px] font-bold tracking-[0.2em] hover:text-[#C5A059] transition-colors uppercase"
          >
            Services
          </Link>
          <AdminLoginModal 
            trigger={
              <button className="flex items-center space-x-2 text-[11px] font-bold tracking-[0.2em] hover:text-[#C5A059] transition-colors uppercase">
                <span>Admin Login</span>
                <Lock size={12} className="mb-0.5" />
              </button>
            }
          />
        </div>

        {/* Center Logo (Always Centered) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="text-xl md:text-2xl serif uppercase tracking-[0.4em] font-light">
            Anubhuti
          </Link>
        </div>

        {/* Desktop Right Side Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] font-bold tracking-[0.2em] border-b border-white/20 pb-0.5 hover:text-[#C5A059] hover:border-[#C5A059] transition-all uppercase"
          >
            Instagram
          </a>
          <a 
            href="https://whatsapp.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] font-bold tracking-[0.2em] border-b border-white/20 pb-0.5 hover:text-[#C5A059] hover:border-[#C5A059] transition-all uppercase"
          >
            Whatsapp
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsOpen(true)}
          className="md:hidden ml-auto text-white p-1"
          aria-label="Open Menu"
        >
          <Menu size={24} strokeWidth={1.5} />
        </button>
      </nav>

      {/* Mobile Full-Screen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center text-white"
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 p-2 text-white/60 hover:text-white"
              aria-label="Close Menu"
            >
              <X size={32} strokeWidth={1} />
            </button>

            {/* Logo in Mobile Menu */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2">
              <span className="text-lg serif uppercase tracking-[0.4em] font-light text-[#C5A059]">Anubhuti</span>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col items-center space-y-10 text-center px-6">
              <Link to="/ledger" className="text-3xl serif uppercase tracking-[0.2em] hover:text-[#C5A059] transition-colors">
                About
              </Link>
              <Link to="/archive" className="text-3xl serif uppercase tracking-[0.2em] hover:text-[#C5A059] transition-colors">
                Services
              </Link>
              <AdminLoginModal 
                trigger={
                  <button className="text-3xl serif uppercase tracking-[0.2em] hover:text-[#C5A059] transition-colors flex items-center space-x-3">
                    <span>Admin Login</span>
                    <Lock size={20} />
                  </button>
                }
              />
            </div>

            {/* Social Links Footer */}
            <div className="absolute bottom-16 flex items-center space-x-8">
              <a href="#" className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#C5A059] transition-colors">Instagram</a>
              <a href="#" className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-[#C5A059] transition-colors">Whatsapp</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;