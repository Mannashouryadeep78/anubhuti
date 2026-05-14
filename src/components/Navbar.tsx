"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from './CartDrawer';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Determine if the user has "entered" the archive
  const hasEntered = location.pathname !== '/' && location.pathname !== '/admin/login';

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
          
          {hasEntered && (
            <>
              <Link 
                to="/archive" 
                className="text-[11px] font-bold tracking-[0.2em] hover:text-gray-400 transition-colors uppercase"
              >
                Archive
              </Link>
              <Link 
                to="/orders" 
                className="text-[11px] font-bold tracking-[0.2em] hover:text-gray-400 transition-colors uppercase"
              >
                Orders
              </Link>
            </>
          )}

          {!hasEntered && (
            <Link 
              to="/admin/login" 
              className="flex items-center space-x-2 text-[11px] font-bold tracking-[0.2em] hover:text-gray-400 transition-colors uppercase"
            >
              <span>Admin</span>
              <Lock size={12} className="mb-0.5" />
            </Link>
          )}
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="text-xl md:text-2xl serif uppercase tracking-[0.4em] font-light">
            Anubhuti
          </Link>
        </div>

        {/* Desktop Right Side Links */}
        <div className="hidden md:flex items-center space-x-8">
          {hasEntered && <CartDrawer />}
          <a 
            href="#" 
            className="text-[11px] font-bold tracking-[0.2em] border-b border-white pb-0.5 hover:text-gray-400 hover:border-gray-400 transition-all uppercase"
          >
            Instagram
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-4 ml-auto">
          {hasEntered && <CartDrawer />}
          <button 
            onClick={() => setIsOpen(true)}
            className="text-white p-1"
            aria-label="Open Menu"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
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
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 p-2"
            >
              <X size={32} strokeWidth={1} />
            </button>

            <div className="flex flex-col items-center space-y-12 text-center px-6">
              <Link to="/ledger" className="text-4xl serif uppercase tracking-tight">About</Link>
              {hasEntered && (
                <>
                  <Link to="/archive" className="text-4xl serif uppercase tracking-tight">Archive</Link>
                  <Link to="/orders" className="text-4xl serif uppercase tracking-tight">Orders</Link>
                </>
              )}
              {!hasEntered && <Link to="/admin/login" className="text-4xl serif uppercase tracking-tight">Admin</Link>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;