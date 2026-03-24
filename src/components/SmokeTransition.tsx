"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

interface SmokeTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
}

const SmokeTransition = ({ isActive, onComplete }: SmokeTransitionProps) => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  useEffect(() => {
    if (isActive) {
      // GSAP animation for the overlay filling up
      gsap.to(".smoke-overlay", {
        opacity: 1,
        duration: 1.5,
        ease: "power2.inOut",
        onComplete: () => {
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
        }
      });
    }
  }, [isActive, onComplete]);

  if (!init) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* The Smoke Particles */}
          <Particles
            id="tsparticles-smoke"
            options={{
              fpsLimit: 60,
              particles: {
                number: { value: 80, density: { enable: true, area: 800 } },
                color: { value: "#ffffff" },
                shape: { type: "circle" },
                opacity: {
                  value: { min: 0.05, max: 0.2 },
                  animation: { enable: true, speed: 0.5, sync: false }
                },
                size: {
                  value: { min: 20, max: 80 },
                  animation: { enable: true, speed: 2, sync: false }
                },
                move: {
                  enable: true,
                  speed: 1.5,
                  direction: "top",
                  random: true,
                  straight: false,
                  outModes: { default: "out" },
                },
              },
              detectRetina: true,
            }}
            className="absolute inset-0"
          />
          
          {/* Solid Overlay that fills the screen */}
          <div className="smoke-overlay absolute inset-0 bg-[#0A0A0A] opacity-0" />
        </div>
      )}
    </AnimatePresence>
  );
};

export default SmokeTransition;