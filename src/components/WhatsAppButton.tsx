"use client";

import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";

export default function WhatsAppButton() {
  const pathname = usePathname();
  
  // Only show on public pages (not on dashboard)
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <motion.a
      href="https://wa.me/252637736519"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.1, 
        y: -5,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[999] flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] text-white rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:shadow-[0_20px_50px_rgba(37,211,102,0.6)] transition-all duration-300 group"
      aria-label="Contact us on WhatsApp"
    >
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse opacity-30 group-hover:opacity-50 transition-opacity" />
      
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-[#25D366] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />

      <motion.div
        animate={{ 
          y: [0, -4, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10"
      >
        <FaWhatsapp className="w-7 h-7 sm:w-8 sm:h-8" />
      </motion.div>

      {/* Persistent Label */}
      <div className="absolute right-full mr-4 px-5 py-2.5 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl border border-white/10 opacity-100 whitespace-nowrap pointer-events-none flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        ma u baahantay caawimaad?
        <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-[6px] border-transparent border-l-slate-900/90" />
      </div>
    </motion.a>
  );
}
