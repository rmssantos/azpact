"use client";

import { motion } from "framer-motion";
import { DiskTopology } from "@/types";

interface DiskIconProps {
  size?: number;
  animated?: boolean;
  type?: "os" | "data" | "temp";
  topology?: DiskTopology;
}

export function DiskIcon({
  size = 60,
  animated = true,
  type = "data",
  topology = "raw",
}: DiskIconProps) {
  const typeColors = {
    os: "#0078d4",
    data: "#10b981",
    temp: "#f59e0b",
  };

  const topologyBadge: Record<DiskTopology, string | null> = {
    raw: null,
    lvm: "LVM",
    raid0: "R0",
    raid1: "R1",
    raid5: "R5",
    "storage-spaces": "SS",
    striped: "STR",
    mirrored: "MIR",
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={animated ? { rotateY: 90, opacity: 0 } : undefined}
      animate={animated ? { rotateY: 0, opacity: 1 } : undefined}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Disk body - 3D effect */}
      <motion.ellipse
        cx="30"
        cy="48"
        rx="24"
        ry="6"
        fill="#0d1f33"
        initial={animated ? { scaleX: 0 } : undefined}
        animate={animated ? { scaleX: 1 } : undefined}
        transition={{ delay: 0.2 }}
      />

      {/* Disk cylinder */}
      <motion.path
        d="M6 18 L6 48 C6 51.3 16.7 54 30 54 C43.3 54 54 51.3 54 48 L54 18"
        fill="url(#diskGradient)"
        stroke={typeColors[type]}
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.6 }}
      />

      {/* Top ellipse */}
      <motion.ellipse
        cx="30"
        cy="18"
        rx="24"
        ry="6"
        fill="#1e3a5f"
        stroke={typeColors[type]}
        strokeWidth="2"
        initial={animated ? { scale: 0 } : undefined}
        animate={animated ? { scale: 1 } : undefined}
        transition={{ delay: 0.3 }}
      />

      {/* Inner rings */}
      <motion.ellipse
        cx="30"
        cy="18"
        rx="16"
        ry="4"
        fill="none"
        stroke={typeColors[type]}
        strokeWidth="1"
        opacity="0.5"
        animate={animated ? { rotate: 360 } : undefined}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.ellipse
        cx="30"
        cy="18"
        rx="8"
        ry="2"
        fill="none"
        stroke={typeColors[type]}
        strokeWidth="1"
        opacity="0.3"
        animate={animated ? { rotate: -360 } : undefined}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* Center spindle */}
      <circle cx="30" cy="18" r="3" fill={typeColors[type]} />

      {/* Topology badge */}
      {topologyBadge[topology] && (
        <g>
          <rect x="40" y="2" width="18" height="12" rx="2" fill="#1a1f2e" stroke={typeColors[type]} strokeWidth="1" />
          <text x="49" y="11" textAnchor="middle" fill={typeColors[type]} fontSize="7" fontWeight="bold">
            {topologyBadge[topology]}
          </text>
        </g>
      )}

      <defs>
        <linearGradient id="diskGradient" x1="6" y1="18" x2="54" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a5f" />
          <stop offset="1" stopColor="#0d1f33" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
