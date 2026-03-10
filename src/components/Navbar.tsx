"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  return (
    <nav className="w-full bg-black text-white py-6 px-8 md:px-12 flex items-center justify-between z-50">
      {/* Left Side Links */}
      <div className="flex items-center space-x-8">
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

      {/* Center Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Link to="/" className="text-3xl serif italic tracking-tight lowercase">
          Anubhuti
        </Link>
      </div>

      {/* Right Side Links */}
      <div className="flex items-center space-x-8">
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
    </nav>
  );
};

export default Navbar;