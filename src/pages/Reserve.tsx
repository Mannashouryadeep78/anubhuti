import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SutraKnot } from '@/components/SutraKnot';

const Reserve = () => {
  return (
    <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full text-center space-y-16"
      >
        <SutraKnot className="w-12 h-12 mx-auto text-primary/20" />
        
        <div className="space-y-4">
          <h1 className="text-3xl serif font-light">Request a Personal Curation</h1>
          <p className="text-sm text-muted-foreground tracking-wide leading-relaxed">
            Our works are protected by intention. To ensure the integrity of the hand-loomed process, we offer private consultations for those seeking the full ritual experience.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <button className="py-6 bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.5em] hover:bg-primary/90 transition-colors">
            Book Private Consultation
          </button>
          <button className="py-6 border border-primary/10 text-[10px] uppercase tracking-[0.5em] hover:border-primary/40 transition-colors">
            Contact via WhatsApp
          </button>
        </div>

        <div className="pt-8">
          <Link to="/archive" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
            Return to Archive
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Reserve;