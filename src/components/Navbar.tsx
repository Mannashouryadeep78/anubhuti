"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <nav className="w-full bg-black text-white py-6 px-6 md:px-12 flex items-center justify-between z-50 relative">
        {/* Desktop Left Side Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            to="/ledger" 
            className="text-[11px] font-bold tracking-[0.2em] hover:text-gray-400 transition-colors uppercase"
          >
            About
          </Link>
          <Link 
            to="/archive" 
            className="text-[11px] font-bold tracking-[0.2em] hover:text-gray-400 transition-colors uppercase"
          >
            Services
          </Link>
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-[11px] font-bold tracking-[0.2em] hover:text-gray-400 transition-colors uppercase"
          >
            <span>Behind the Door Nº9</span>
            <Lock size={12} className="mb-0.5" />
          </Link>
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
            className="text-[11px] font-bold tracking-[0.2em] border-b border-white pb-0.5 hover:text-gray-400 hover:border-gray-400 transition-all uppercase"
          >
            Instagram
          </a>
          <a 
            href="https://whatsapp.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] font-bold tracking-[0.2em] border-b border-white pb-0.5 hover:text-gray-400 hover:border-gray-400 transition-all uppercase"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center text-black"
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 p-2"
              aria-label="Close Menu"
            >
              <X size={32} strokeWidth={1} />
            </button>

            {/* Logo in Mobile Menu */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2">
              <span className="text-lg serif uppercase tracking-[0.4em] font-light">Anubhuti</span>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col items-center space-y-12 text-center px-6">
              <Link to="/ledger" className="text-4xl md:text-5xl serif uppercase tracking-tight hover:opacity-60 transition-opacity">
                About
              </Link>
              <Link to="/archive" className="text-4xl md:text-5xl serif uppercase tracking-tight hover:opacity-60 transition-opacity">
                Services
              </Link>
              <Link to="/" className="text-4xl md:text-5xl serif uppercase tracking-tight hover:opacity-60 transition-opacity">
                Behind the Door...
              </Link>
            </div>

            {/* Social Links Footer */}
            <div className="absolute bottom-16 flex items-center space-x-8">
              <a href="#" className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">Instagram</a>
              <a href="#" className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">Pinterest</a>
              <a href="#" className="text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">Facebook</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;