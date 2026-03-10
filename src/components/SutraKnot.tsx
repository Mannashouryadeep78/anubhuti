"use client";

import React from 'react';
import { motion } from 'framer-motion';

const SutraKnot = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <path
        d="M50 10 C 30 10, 10 30, 10 50 C 10 70, 30 90, 50 90 C 70 90, 90 70, 90 50 C 90 30, 70 10, 50 10 M50 30 L50 70 M30 50 L70 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
    </motion.svg>
  );
};

export default SutraKnot;