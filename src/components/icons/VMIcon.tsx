"use client";

import { motion } from "framer-motion";

interface VMIconProps {
  size?: number;
  animated?: boolean;
  status?: "healthy" | "warning" | "error";
}

export function VMIcon({ size = 80, animated = true, status = "healthy" }: VMIconProps) {
  const statusColors = {
    healthy: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* VM Body */}
      <motion.rect
        x="10"
        y="15"
        width="60"
        height="45"
        rx="4"
        fill="url(#vmGradient)"
        stroke="#0078d4"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.8 }}
      />

      {/* Screen */}
      <rect x="15" y="20" width="50" height="30" rx="2" fill="#1a1f2e" />

      {/* Screen content lines */}
      <motion.g
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <rect x="20" y="26" width="25" height="2" rx="1" fill="#50e6ff" />
        <rect x="20" y="32" width="35" height="2" rx="1" fill="#0078d4" opacity="0.7" />
        <rect x="20" y="38" width="20" height="2" rx="1" fill="#0078d4" opacity="0.5" />
      </motion.g>

      {/* Status indicator */}
      <motion.circle
        cx="58"
        cy="25"
        r="3"
        fill={statusColors[status]}
        animate={animated ? { opacity: [1, 0.5, 1] } : undefined}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Stand */}
      <rect x="32" y="60" width="16" height="4" fill="#0078d4" />
      <rect x="25" y="64" width="30" height="3" rx="1" fill="#106ebe" />

      <defs>
        <linearGradient id="vmGradient" x1="10" y1="15" x2="70" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a5f" />
          <stop offset="1" stopColor="#0d1f33" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
