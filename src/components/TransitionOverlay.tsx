"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransitionOverlayProps {
  show: boolean;
  onComplete: () => void;
}

const TransitionOverlay = ({ show, onComplete }: TransitionOverlayProps) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Total duration 5 seconds: 4s on first page, 1s on second page
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
        >
          {/* 
            Increased transparency with opacity-40 and mix-blend-screen 
            to make it look like a subtle atmospheric layer.
          */}
          <video 
            autoPlay 
            muted
            playsInline
            className="w-full h-full object-cover mix-blend-screen opacity-40"
          >
            <source src="/src/assets/transition.mp4" type="video/mp4" />
          </video>
          
          {/* Subtle dark overlay that only appears at the very end to smooth the transition */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 0] }}
            transition={{ times: [0, 0.7, 0.8, 1], duration: 5 }}
            className="absolute inset-0 bg-black pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransitionOverlay;