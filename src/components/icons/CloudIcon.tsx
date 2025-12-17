"use client";

import { motion } from "framer-motion";

interface CloudIconProps {
  size?: number;
  animated?: boolean;
}

export function CloudIcon({ size = 120, animated = true }: CloudIconProps) {
  return (
    <motion.svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={animated ? { y: 10, opacity: 0 } : undefined}
      animate={animated ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Main cloud body */}
      <motion.path
        d="M95 52H25C14.5 52 6 43.5 6 33C6 22.5 14.5 14 25 14C25.5 14 26 14 26.5 14.1C30.5 6.4 38.5 1 48 1C60 1 70 9.5 72 20.5C74.5 19.5 77.2 19 80 19C93.3 19 104 29.7 104 43C104 45.4 103.7 47.7 103.1 49.9C102.4 51.3 99 52 95 52Z"
        fill="url(#cloudGradient)"
        stroke="#0078d4"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 1.2 }}
      />

      {/* Azure logo simplified */}
      <motion.g
        initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
        animate={animated ? { opacity: 1, scale: 1 } : undefined}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <path
          d="M45 28L55 44H40L50 28L45 28Z"
          fill="#0078d4"
        />
        <path
          d="M55 28L65 44H50L60 28L55 28Z"
          fill="#50e6ff"
        />
      </motion.g>

      {/* Floating particles */}
      {animated && (
        <>
          <motion.circle
            cx="30"
            cy="35"
            r="2"
            fill="#50e6ff"
            animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.circle
            cx="75"
            cy="30"
            r="1.5"
            fill="#50e6ff"
            animate={{ y: [2, -2, 2], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="88"
            cy="40"
            r="2"
            fill="#0078d4"
            animate={{ y: [-3, 3, -3], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          />
        </>
      )}

      <defs>
        <linearGradient id="cloudGradient" x1="6" y1="1" x2="104" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a5f" stopOpacity="0.8" />
          <stop offset="1" stopColor="#0d1f33" stopOpacity="0.9" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
