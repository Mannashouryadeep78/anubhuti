"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface TransitionOverlayProps {
  show: boolean;
  onComplete: () => void;
}

const TransitionOverlay = ({ show, onComplete }: TransitionOverlayProps) => {
  const [shouldRender, setShouldRender] = useState(false);
  const location = useLocation();
  
  // We detect if we've moved away from the landing page
  const isOnArchive = location.pathname === '/archive';

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Total duration 5 seconds
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
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* 
            The Background: 
            Starts as solid black to hide the landing page.
            Once we navigate to /archive, it becomes transparent so the smoke 
            appears as an effect over the new page.
          */}
          <motion.div 
            initial={{ backgroundColor: "rgba(0,0,0,1)" }}
            animate={{ 
              backgroundColor: isOnArchive ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)" 
            }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          />

          {/* 
            The Smoke Video:
            Using mix-blend-screen so the smoke is visible but its black background 
            is transparent relative to the container.
          */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover mix-blend-screen opacity-60"
          >
            <source src="/transition.mp4" type="video/mp4" />
          </video>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransitionOverlay;