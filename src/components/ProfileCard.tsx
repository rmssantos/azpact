"use client";

import { motion } from "framer-motion";
import {
  Server,
  HardDrive,
  Network,
  MapPin,
  X,
  CheckCircle,
  AlertTriangle,
  Shield,
  Globe,
} from "lucide-react";
import { ParsedVMProfile } from "@/lib/profile-parser";

interface ProfileCardProps {
  profile: ParsedVMProfile;
  onClear: () => void;
}

export function ProfileCard({ profile, onClear }: ProfileCardProps) {
  // Build OS display string
  const osDisplay = profile.osDistro
    ? `${profile.osDistro}${profile.osVersion ? ` ${profile.osVersion}` : ""}`
    : profile.osFamily;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 mb-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Profile Loaded</p>
            <p className="font-semibold text-white">{profile.name}</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          title="Clear profile"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* SKU */}
        <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
          <Server className="w-4 h-4 text-blue-400" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">SKU</p>
            <p className="text-sm font-medium text-white truncate">{profile.sku}</p>
          </div>
        </div>

        {/* OS */}
        <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
          <span className="text-lg">{profile.osFamily === "Linux" ? "🐧" : "🪟"}</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">OS</p>
            <p className="text-sm font-medium text-white truncate" title={osDisplay}>{osDisplay}</p>
          </div>
        </div>

        {/* Disks */}
        <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
          <HardDrive className="w-4 h-4 text-amber-400" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">OS Disk</p>
            <p className="text-sm font-medium text-white">
              {profile.disks.os.sizeGB}GB {profile.disks.data.length > 0 ? `+ ${profile.disks.data.length} Data` : ""}
            </p>
          </div>
        </div>

        {/* NICs */}
        <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
          <Network className="w-4 h-4 text-cyan-400" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500">NICs</p>
            <p className="text-sm font-medium text-white">{profile.nicCount}</p>
          </div>
        </div>
      </div>

      {/* Additional Info Row */}
      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
        {/* Generation badge */}
        <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-300">
          {profile.generation}
        </span>

        {/* Location/Zone */}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 text-gray-300">
          {profile.zonal ? (
            <>
              <MapPin className="w-3 h-3" />
              Zone {profile.zone}
            </>
          ) : (
            <>
              <Globe className="w-3 h-3" />
              {profile.location}
            </>
          )}
        </span>

        {/* Security badge if TrustedLaunch */}
        {profile.security?.type === "TrustedLaunch" && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300">
            <Shield className="w-3 h-3" />
            Trusted Launch
          </span>
        )}

        {/* Disk type badge */}
        <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400">
          {profile.disks.os.type.replace("_LRS", "")}
        </span>
      </div>

      {/* Guest OS warning */}
      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-700">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">
          Guest OS details unknown (filesystems, LVM, mount points).
          For sensitive operations, you&apos;ll be asked for details.
        </p>
      </div>
    </motion.div>
  );
}
