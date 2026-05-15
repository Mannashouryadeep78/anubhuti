import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ArrowRight } from 'lucide-react';
import { nodes, kafkaTopics, buildOrder, ArchNode } from '@/data/architectureData';

const methodColor = (m: string) => {
  if (m === 'GET') return 'text-green-400';
  if (m === 'POST') return 'text-blue-400';
  if (m === 'PATCH') return 'text-yellow-400';
  return 'text-red-400';
};

const DiagramNode = ({ node, onClick, isActive }: { node: ArchNode; onClick: () => void; isActive: boolean }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.04, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className={`relative flex flex-col items-center gap-2 p-4 border rounded-none cursor-pointer transition-all duration-300 min-w-[140px] ${
      isActive
        ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]'
        : 'bg-white/5 border-white/20 hover:border-white/60 text-white'
    }`}
  >
    <span className="text-2xl">{node.icon}</span>
    <span className="text-[11px] font-bold uppercase tracking-widest leading-tight text-center">{node.label}</span>
    <span className={`text-[9px] tracking-wide text-center leading-tight ${isActive ? 'text-black/60' : 'text-white/40'}`}>
      {node.sublabel}
    </span>
    {isActive && (
      <motion.div
        layoutId="active-indicator"
        className="absolute -bottom-[1px] left-0 right-0 h-[2px]"
        style={{ background: node.color }}
      />
    )}
  </motion.button>
);

const Arrow = ({ label, vertical }: { label?: string; vertical?: boolean }) => (
  <div className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center gap-1 opacity-40`}>
    {vertical ? (
      <>
        <div className="w-px h-6 bg-white/40" />
        <span className="text-white text-xs">↓</span>
        {label && <span className="text-[9px] text-white/50 uppercase tracking-widest">{label}</span>}
      </>
    ) : (
      <>
        <div className="h-px w-8 bg-white/40" />
        <ArrowRight size={10} className="text-white/50" />
      </>
    )}
  </div>
);

const DetailPanel = ({ node, onClose }: { node: ArchNode; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 40 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-[#0A0A0A] border-l border-white/10 z-50 overflow-y-auto"
  >
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-3xl">{node.icon}</span>
          <h2 className="text-2xl serif font-light text-white mt-2">{node.detail.title}</h2>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{node.sublabel}</p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: `linear-gradient(to right, ${node.color}, transparent)` }} />

      {/* Description */}
      <p className="text-sm text-white/70 leading-relaxed">{node.detail.description}</p>

      {/* Endpoints */}
      {node.detail.endpoints && (
        <div className="space-y-3">
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40">API Endpoints</h3>
          {node.detail.endpoints.map((ep, i) => (
            <div key={i} className="flex gap-3 items-start bg-white/5 p-3">
              <span className={`text-[10px] font-bold font-mono shrink-0 w-12 ${methodColor(ep.method)}`}>{ep.method}</span>
              <div>
                <code className="text-xs text-white font-mono">{ep.path}</code>
                <p className="text-[11px] text-white/50 mt-0.5">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bullets */}
      {node.detail.bullets && (
        <div className="space-y-3">
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40">Key Concepts</h3>
          {node.detail.bullets.map((b, i) => (
            <div key={i} className="flex gap-3 items-start">
              <ChevronRight size={12} className="text-white/30 shrink-0 mt-0.5" style={{ color: node.color }} />
              <p className="text-[12px] text-white/70 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      )}

      {/* Code */}
      {node.detail.code && (
        <div className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40">Implementation</h3>
          <pre className="bg-white/5 border border-white/10 p-4 rounded-none overflow-x-auto text-[11px] text-green-300 font-mono leading-relaxed whitespace-pre-wrap">
            {node.detail.code.snippet}
          </pre>
        </div>
      )}
    </div>
  </motion.div>
);

const ArchitecturePage = () => {
  const [activeNode, setActiveNode] = useState<ArchNode | null>(null);

  const getNode = (id: string) => nodes.find(n => n.id === id)!;
  const toggle = (id: string) => {
    const n = getNode(id);
    setActiveNode(prev => prev?.id === id ? null : n);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto px-6 py-32 space-y-24">

        {/* Header */}
        <header className="text-center space-y-4">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">System Design</p>
          <h1 className="text-5xl md:text-6xl serif font-light">Architecture Blueprint</h1>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
            Event-driven microservices — click any component for a detailed breakdown of APIs, code, and design decisions.
          </p>
        </header>

        {/* Architecture Diagram */}
        <section className="space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30 text-center">System Diagram</h2>

          <div className="border border-white/10 p-8 md:p-12 space-y-0">

            {/* Row 1: Frontend */}
            <div className="flex flex-col items-center gap-0">
              <DiagramNode node={getNode('frontend')} onClick={() => toggle('frontend')} isActive={activeNode?.id === 'frontend'} />
              <Arrow vertical label="HTTPS + JWT" />
            </div>

            {/* Row 2: Gateway */}
            <div className="flex flex-col items-center gap-0">
              <DiagramNode node={getNode('gateway')} onClick={() => toggle('gateway')} isActive={activeNode?.id === 'gateway'} />
              <Arrow vertical />
            </div>

            {/* Row 3: Three Services */}
            <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-8">
              <div className="flex flex-col items-center gap-0">
                <DiagramNode node={getNode('user-service')} onClick={() => toggle('user-service')} isActive={activeNode?.id === 'user-service'} />
              </div>
              <div className="hidden md:flex items-center self-center opacity-20 mt-[-20px]">
                <div className="h-px w-16 bg-white" />
              </div>
              <div className="flex flex-col items-center gap-0">
                <DiagramNode node={getNode('inventory-service')} onClick={() => toggle('inventory-service')} isActive={activeNode?.id === 'inventory-service'} />
              </div>
              <div className="hidden md:flex items-center self-center opacity-20 mt-[-20px]">
                <div className="h-px w-16 bg-white" />
              </div>
              <div className="flex flex-col items-center gap-0">
                <DiagramNode node={getNode('order-service')} onClick={() => toggle('order-service')} isActive={activeNode?.id === 'order-service'} />
              </div>
            </div>

            {/* Arrow to Kafka */}
            <div className="flex flex-col items-center">
              <Arrow vertical label="Kafka Events" />
            </div>

            {/* Row 4: Kafka + Razorpay + Redis */}
            <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-8">
              <DiagramNode node={getNode('kafka')} onClick={() => toggle('kafka')} isActive={activeNode?.id === 'kafka'} />
              <DiagramNode node={getNode('razorpay')} onClick={() => toggle('razorpay')} isActive={activeNode?.id === 'razorpay'} />
              <DiagramNode node={getNode('redis')} onClick={() => toggle('redis')} isActive={activeNode?.id === 'redis'} />
            </div>

          </div>
        </section>

        {/* Kafka Topics Table */}
        <section className="space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30">Kafka Topics</h2>
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-normal">Topic</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-normal">Producer</th>
                  <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-normal">Consumers</th>
                </tr>
              </thead>
              <tbody>
                {kafkaTopics.map((t, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <code className="text-[#E8B840] text-xs font-mono">{t.topic}</code>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-xs">{t.producer}</td>
                    <td className="px-6 py-4 text-white/60 text-xs">{t.consumers}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Order Status Machine */}
        <section className="space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30">Order Status Machine</h2>
          <div className="border border-white/10 p-8">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              {['PENDING', 'PAYMENT_INITIATED', 'PAYMENT_CAPTURED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((s, i, arr) => (
                <React.Fragment key={s}>
                  <span className="text-[10px] font-mono font-bold px-3 py-2 border border-white/20 text-white/70 tracking-widest">{s}</span>
                  {i < arr.length - 1 && <ArrowRight size={14} className="text-white/20 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center gap-3 justify-center mt-4">
              <span className="text-white/20 text-xs">PROCESSING</span>
              <ArrowRight size={12} className="text-white/20 rotate-45" />
              <span className="text-[10px] font-mono font-bold px-3 py-2 border border-red-800/40 text-red-400/70 tracking-widest">CANCELLED</span>
            </div>
          </div>
        </section>

        {/* Build Order Roadmap */}
        <section className="space-y-6">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30">Migration Roadmap</h2>
          <div className="space-y-4">
            {buildOrder.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-6 items-start border border-white/10 p-6 hover:border-white/30 transition-colors"
              >
                <span className="text-4xl serif font-light text-white/20 shrink-0 leading-none w-8">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-bold text-white tracking-wide">{item.title}</p>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {activeNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveNode(null)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <DetailPanel node={activeNode} onClose={() => setActiveNode(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArchitecturePage;
