"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Car, GraduationCap, Microscope, BookOpen, Globe2 } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";

const icons = [Car, GraduationCap, Microscope, BookOpen, Globe2];

export default function MovingBackground() {
  const shouldReduceMotion = useReducedMotion();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const elements = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 20 + Math.random() * 30,
        delay: Math.random() * -20,
        iconIndex: Math.floor(Math.random() * icons.length),
        size: 20 + Math.random() * 30,
      })),
    [],
  );

  if (!mounted || shouldReduceMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10 dark:opacity-[0.03]">
      {elements.map((el) => {
        const Icon = icons[el.iconIndex];
        return (
          <motion.div
            key={el.id}
            initial={{ x: "-10%", y: `${el.y}%`, opacity: 0 }}
            animate={{
              x: "110%",
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: "linear",
            }}
            style={{ 
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <Icon size={el.size} className="text-indigo-600 dark:text-indigo-400" />
          </motion.div>
        );
      })}
    </div>
  );
}
