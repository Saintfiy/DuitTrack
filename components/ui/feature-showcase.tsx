"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  baseColor: string;
  accentBg: string;
  preview?: React.ReactNode;
}

interface FeatureShowcaseProps {
  features: Feature[];
}

export function FeatureShowcase({ features }: FeatureShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-8 lg:gap-16 max-w-6xl mx-auto w-full items-start">
      {/* Left Panel: Feature List */}
      <div className="w-full md:w-[45%] flex flex-col justify-center space-y-2">
        {features.map((feature, idx) => {
          const isActive = activeIndex === idx;
          return (
            <div
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`cursor-pointer group relative overflow-hidden rounded-2xl px-5 py-4 transition-all duration-300 border ${
                isActive
                  ? "bg-white border-slate-200 shadow-card"
                  : "bg-transparent hover:bg-white/70 border-transparent hover:border-slate-100"
              }`}
            >
              {/* Active left bar */}
              {isActive && (
                <motion.div
                  layoutId="activeFeatureLine"
                  className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${feature.baseColor}`}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ duration: 0.25 }}
                />
              )}

              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `${feature.accentBg} ${feature.color} shadow-sm`
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                  }`}
                >
                  <div className="text-[18px]">{feature.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-bold transition-colors duration-300 ${
                      isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-slate-500 text-xs leading-relaxed mt-1.5 pr-2">
                          {feature.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Panel: Preview Canvas (Sticky) */}
      <div className="w-full md:w-[55%] h-[320px] md:h-[560px] sticky top-28 flex items-center justify-center z-10">
        <div className="relative w-full h-full rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-elevated overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.04, y: -12 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              {/* Soft glow circle */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[90px] rounded-full ${features[activeIndex].accentBg} opacity-30`}
              />

              {features[activeIndex].preview ? (
                <div className="relative z-10 w-full h-full p-5 md:p-8 flex items-center justify-center">
                  {features[activeIndex].preview}
                </div>
              ) : (
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 w-20 h-20 md:w-40 md:h-40 rounded-3xl flex items-center justify-center shadow-elevated bg-white border border-slate-100"
                >
                  <div className={`text-3xl md:text-6xl ${features[activeIndex].color}`}>
                    {features[activeIndex].icon}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.35]"
            style={{
              backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
