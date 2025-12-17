"use client";

import { motion } from "framer-motion";
import { RebootLevel, DowntimeLevel, RiskLevel } from "@/types";

interface ImpactBadgeProps {
  type: "reboot" | "downtime" | "risk";
  level: RebootLevel | DowntimeLevel | RiskLevel;
}

function getConfig(type: string, level: string): { color: string; label: string } {
  const configs: Record<string, Record<string, { color: string; label: string }>> = {
    reboot: {
      none: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "No Reboot" },
      possible: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Possible Reboot" },
      likely: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Likely Reboot" },
      guaranteed: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Guaranteed Reboot" },
    },
    downtime: {
      none: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "No Downtime" },
      low: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Low Downtime" },
      medium: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Medium Downtime" },
      high: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "High Downtime" },
    },
    risk: {
      low: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Low Risk" },
      medium: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Medium Risk" },
      high: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "High Risk" },
      critical: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Critical Risk" },
    },
  };

  return configs[type]?.[level] ?? { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: level };
}

export function ImpactBadge({ type, level }: ImpactBadgeProps) {
  const config = getConfig(type, level);

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
    >
      {config.label}
    </motion.span>
  );
}
