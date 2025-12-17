"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Server,
  HardDrive,
  Zap,
  RefreshCw,
  Trash2,
  ArrowUpRight,
  Shield,
  MapPin,
  Globe,
  Power,
  Square,
  Camera,
  Network,
} from "lucide-react";
import { VMContext, DiskConfig, ActionType, Action, DiskTopology } from "@/types";
import { skus } from "@/data/skus";
import { ParsedVMProfile } from "@/lib/profile-parser";

interface VMFormProps {
  onSubmit: (context: VMContext, action: Action) => void;
  profile?: ParsedVMProfile | null;
}

// Quick start examples for common scenarios
const quickStartExamples = [
  {
    label: "Resize to different processor",
    description: "Intel → AMD",
    context: {
      vm: { sku: "Standard_D4s_v5", generation: "Gen2" as const, zonal: true },
      os: { family: "Linux" as const, distro: "Ubuntu", version: "22.04" },
      disks: [{ lun: 0, name: "os-disk", role: "os" as const, sizeGB: 128, type: "Premium_LRS" as const }],
    },
    action: { type: "ResizeVM" as ActionType, targetSku: "Standard_D4as_v5" },
  },
  {
    label: "Detach LVM disk",
    description: "Linux LVM removal",
    context: {
      vm: { sku: "Standard_D4s_v5", generation: "Gen2" as const, zonal: true },
      os: { family: "Linux" as const, distro: "Ubuntu", version: "22.04" },
      disks: [
        { lun: 0, name: "os-disk", role: "os" as const, sizeGB: 128, type: "Premium_LRS" as const },
        { lun: 1, name: "data-disk", role: "data" as const, sizeGB: 256, type: "Premium_LRS" as const, topology: "lvm" as const, mount: "/mnt/data", vg: "vgdata" },
      ],
    },
    action: { type: "DetachDisk" as ActionType, targetLun: 1 },
  },
  {
    label: "Enable encryption",
    description: "Windows BitLocker",
    context: {
      vm: { sku: "Standard_D4s_v5", generation: "Gen2" as const, zonal: true },
      os: { family: "Windows" as const, distro: "Windows Server", version: "2022" },
      disks: [{ lun: 0, name: "os-disk", role: "os" as const, sizeGB: 128, type: "Premium_LRS" as const }],
    },
    action: { type: "EnableEncryption" as ActionType, encryptionOperation: "enable" as const, encryptionTarget: "os" as const },
  },
];

const actionGroups = [
  {
    name: "VM Operations",
    actions: [
      {
        type: "ResizeVM" as ActionType,
        label: "Resize VM",
        description: "Change VM size/SKU",
        icon: Server,
        color: "blue",
      },
      {
        type: "StopVM" as ActionType,
        label: "Stop VM",
        description: "Stop (keep allocated)",
        icon: Power,
        color: "orange",
      },
      {
        type: "DeallocateVM" as ActionType,
        label: "Deallocate",
        description: "Stop & release hardware",
        icon: Square,
        color: "red",
      },
      {
        type: "RedeployVM" as ActionType,
        label: "Redeploy",
        description: "Move to new host",
        icon: RefreshCw,
        color: "purple",
      },
      {
        type: "CaptureVM" as ActionType,
        label: "Capture",
        description: "Create image",
        icon: Camera,
        color: "violet",
      },
    ],
  },
  {
    name: "Disk Operations",
    actions: [
      {
        type: "ResizeOSDisk" as ActionType,
        label: "Resize OS Disk",
        description: "Expand OS disk",
        icon: HardDrive,
        color: "emerald",
      },
      {
        type: "ResizeDataDisk" as ActionType,
        label: "Resize Data Disk",
        description: "Expand data disk",
        icon: ArrowUpRight,
        color: "cyan",
      },
      {
        type: "DetachDisk" as ActionType,
        label: "Detach Disk",
        description: "Remove disk",
        icon: Trash2,
        color: "amber",
      },
      {
        type: "EnableEncryption" as ActionType,
        label: "Encryption",
        description: "Enable/Disable ADE",
        icon: Shield,
        color: "indigo",
      },
    ],
  },
  {
    name: "Networking",
    actions: [
      {
        type: "AddNIC" as ActionType,
        label: "Add NIC",
        description: "Attach network interface",
        icon: Network,
        color: "sky",
      },
      {
        type: "RemoveNIC" as ActionType,
        label: "Remove NIC",
        description: "Detach network interface",
        icon: Network,
        color: "slate",
      },
    ],
  },
  {
    name: "Migration & HA",
    actions: [
      {
        type: "ChangeZone" as ActionType,
        label: "Change Zone",
        description: "Availability Zone",
        icon: MapPin,
        color: "rose",
      },
      {
        type: "CrossRegionMove" as ActionType,
        label: "Region Move",
        description: "Cross-region",
        icon: Globe,
        color: "teal",
      },
    ],
  },
];

const linuxTopologies = [
  { value: "raw", label: "Raw/Simple", description: "Single partition" },
  { value: "lvm", label: "LVM", description: "Logical Volume Manager" },
  { value: "raid0", label: "RAID 0", description: "Striping (no redundancy)" },
  { value: "raid1", label: "RAID 1", description: "Mirroring" },
  { value: "raid5", label: "RAID 5", description: "Striping + parity" },
];

const windowsTopologies = [
  { value: "raw", label: "Simple Volume", description: "Basic partition" },
  { value: "storage-spaces", label: "Storage Spaces", description: "Pooled storage" },
  { value: "striped", label: "Striped", description: "RAID 0 equivalent" },
  { value: "mirrored", label: "Mirrored", description: "RAID 1 equivalent" },
];

const pageTransition = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

export function VMForm({ onSubmit, profile }: VMFormProps) {
  const [step, setStep] = useState(1);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  // Resize VM state
  const [sourceSku, setSourceSku] = useState("Standard_D4s_v5");
  const [targetSku, setTargetSku] = useState("Standard_D8s_v5");
  const [generation, setGeneration] = useState<"Gen1" | "Gen2">("Gen2");
  const [dataDisksCount, setDataDisksCount] = useState(0);
  const [hasUltraSSD, setHasUltraSSD] = useState(false);

  // OS Disk / Data Disk / Detach state
  const [osFamily, setOsFamily] = useState<"Linux" | "Windows">("Linux");
  const [diskTopology, setDiskTopology] = useState<DiskTopology>("raw");
  const [mountPoint, setMountPoint] = useState("/mnt/data");
  const [driveLetter, setDriveLetter] = useState("E");
  const [volumeGroup, setVolumeGroup] = useState("vgdata");

  // Redeploy state
  const [hasTempDiskData, setHasTempDiskData] = useState(false);

  // Encryption state
  const [encryptionOperation, setEncryptionOperation] = useState<"enable" | "disable">("enable");
  const [encryptionTarget, setEncryptionTarget] = useState<"os" | "all">("os");

  // Zone state
  const [isZonalVM, setIsZonalVM] = useState(true);

  // Capture state
  const [generalizeVM, setGeneralizeVM] = useState(true);

  // NIC state
  const [currentNicCount, setCurrentNicCount] = useState(1);

  // Initialize from profile when loaded
  useEffect(() => {
    if (profile) {
      // Check if SKU exists in our list, otherwise use it anyway
      const skuExists = skus.some(s => s.name === profile.sku);
      if (skuExists) {
        setSourceSku(profile.sku);
      }
      setGeneration(profile.generation);
      setOsFamily(profile.osFamily);
      setDataDisksCount(profile.disks.data.length);
      setCurrentNicCount(profile.nicCount);
      setIsZonalVM(profile.zonal);
    }
  }, [profile]);

  const currentSourceSku = skus.find((s) => s.name === sourceSku);
  const currentTargetSku = skus.find((s) => s.name === targetSku);
  const topologies = osFamily === "Linux" ? linuxTopologies : windowsTopologies;

  const handleSelectAction = (type: ActionType) => {
    setActionType(type);
    setStep(2);
  };

  const handleSubmit = () => {
    // Build context based on action type
    const vmConfig = {
      sku: sourceSku,
      generation,
      zonal: actionType === "ChangeZone" ? isZonalVM : true,
    };

    const osConfig = {
      family: osFamily,
      distro: osFamily === "Linux" ? "Ubuntu" : "Windows Server",
      version: osFamily === "Linux" ? "22.04" : "2022",
    };

    // Build disks array
    const disks: DiskConfig[] = [
      { lun: 0, name: "os-disk", role: "os" as const, sizeGB: 128, type: "Premium_LRS" as const },
    ];

    // Add data disks for resize VM
    if (actionType === "ResizeVM") {
      for (let i = 1; i <= dataDisksCount; i++) {
        disks.push({
          lun: i,
          name: `data-disk-${i}`,
          role: "data" as const,
          sizeGB: 256,
          type: hasUltraSSD && i === 1 ? "UltraSSD_LRS" as const : "Premium_LRS" as const,
        });
      }
    }

    // Add target disk for disk operations
    if (actionType === "DetachDisk" || actionType === "ResizeDataDisk") {
      disks.push({
        lun: 1,
        name: "data-disk-1",
        role: "data" as const,
        sizeGB: 256,
        type: "Premium_LRS" as const,
        topology: diskTopology,
        ...(osFamily === "Linux" && { mount: mountPoint }),
        ...(osFamily === "Windows" && { driveLetter }),
        ...(diskTopology === "lvm" && { vg: volumeGroup }),
      });
    }

    // Add data disks for encryption when "All Disks" is selected
    if (actionType === "EnableEncryption" && encryptionTarget === "all") {
      disks.push({
        lun: 1,
        name: "data-disk-1",
        role: "data" as const,
        sizeGB: 256,
        type: "Premium_LRS" as const,
      });
    }

    const context: VMContext = {
      vm: vmConfig,
      os: osConfig,
      disks,
    };

    const action: Action = {
      type: actionType!,
      ...(actionType === "ResizeVM" && { targetSku }),
      ...((actionType === "DetachDisk" || actionType === "ResizeDataDisk") && { targetLun: 1 }),
      ...(actionType === "EnableEncryption" && {
        encryptionOperation,
        encryptionTarget
      }),
      ...(actionType === "CaptureVM" && { generalize: generalizeVM }),
      ...((actionType === "AddNIC" || actionType === "RemoveNIC") && { nicCount: currentNicCount }),
    };

    onSubmit(context, action);
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setActionType(null);
    }
  };

  const getStepCount = () => {
    return 2; // Action selection + context
  };

  const getActionColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "from-blue-500 to-blue-600",
      emerald: "from-emerald-500 to-emerald-600",
      cyan: "from-cyan-500 to-cyan-600",
      amber: "from-amber-500 to-amber-600",
      purple: "from-purple-500 to-purple-600",
      indigo: "from-indigo-500 to-indigo-600",
      rose: "from-rose-500 to-rose-600",
      teal: "from-teal-500 to-teal-600",
      orange: "from-orange-500 to-orange-600",
      red: "from-red-500 to-red-600",
      violet: "from-violet-500 to-violet-600",
      sky: "from-sky-500 to-sky-600",
      slate: "from-slate-500 to-slate-600",
    };
    return colors[color] || colors.blue;
  };

  const getActionBorderColor = (color: string, selected: boolean) => {
    if (!selected) return "border-gray-700 hover:border-gray-600";
    const colors: Record<string, string> = {
      blue: "border-blue-500",
      emerald: "border-emerald-500",
      cyan: "border-cyan-500",
      amber: "border-amber-500",
      purple: "border-purple-500",
      indigo: "border-indigo-500",
      rose: "border-rose-500",
      teal: "border-teal-500",
      orange: "border-orange-500",
      red: "border-red-500",
      violet: "border-violet-500",
      sky: "border-sky-500",
      slate: "border-slate-500",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            step >= 1 ? "bg-blue-500 scale-110" : "bg-gray-700"
          }`}
        />
        <div className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
          step >= 2 ? "bg-blue-500" : "bg-gray-700"
        }`} />
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            step >= 2 ? "bg-blue-500 scale-110" : "bg-gray-700"
          }`}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Action */}
        {step === 1 && (
          <motion.div key="step1" {...pageTransition}>
            <div className="text-center mb-6">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold mb-2"
              >
                What do you want to do?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400"
              >
                Select the Azure operation you want to analyze
              </motion.p>
            </div>

            <div className="space-y-6">
              {actionGroups.map((group, groupIndex) => (
                <motion.div
                  key={group.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  <h3 className="text-sm font-medium text-gray-400 mb-3 px-1">{group.name}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.actions.map((action, index) => (
                      <motion.button
                        key={action.type}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: groupIndex * 0.1 + index * 0.03 }}
                        onClick={() => handleSelectAction(action.type)}
                        className={`glass p-4 rounded-xl border-2 text-left transition-all duration-200 group
                          ${getActionBorderColor(action.color, actionType === action.type)}
                          hover:scale-[1.02] active:scale-[0.98]`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${getActionColor(action.color)}
                            shadow-lg group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{action.label}</p>
                            <p className="text-xs text-gray-500 truncate">{action.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white
                            group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Start Examples */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 pt-6 border-t border-gray-800"
            >
              <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Start Examples
              </p>
              <div className="flex flex-wrap gap-2">
                {quickStartExamples.map((example, index) => (
                  <motion.button
                    key={index}
                    onClick={() => onSubmit(example.context, example.action)}
                    className="px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="text-sm font-medium text-gray-200">{example.label}</p>
                    <p className="text-xs text-gray-500">{example.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Contextual Questions */}
        {step === 2 && actionType && (
          <motion.div key="step2" {...pageTransition} className="glass rounded-2xl p-6 sm:p-8">
            {/* Resize VM */}
            {actionType === "ResizeVM" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Server className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Resize VM</h2>
                    <p className="text-sm text-gray-400">Configure the resize operation</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current SKU</label>
                      <select
                        value={sourceSku}
                        onChange={(e) => setSourceSku(e.target.value)}
                        className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      >
                        {skus.map((sku) => (
                          <option key={sku.name} value={sku.name}>
                            [{sku.processor}] {sku.family} • {sku.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Target SKU</label>
                      <select
                        value={targetSku}
                        onChange={(e) => setTargetSku(e.target.value)}
                        className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      >
                        {skus.filter((s) => s.name !== sourceSku).map((sku) => (
                          <option key={sku.name} value={sku.name}>
                            [{sku.processor}] {sku.family} • {sku.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick comparison */}
                  {currentSourceSku && currentTargetSku && (
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-3">Quick comparison</p>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="text-gray-400">vCPUs</p>
                          <p className="font-semibold">
                            {currentSourceSku.vCPUs} → {currentTargetSku.vCPUs}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Memory</p>
                          <p className="font-semibold">
                            {currentSourceSku.memoryGB}GB → {currentTargetSku.memoryGB}GB
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Temp Disk</p>
                          <p className="font-semibold">
                            {currentSourceSku.tempDiskGB || "None"} → {currentTargetSku.tempDiskGB || "None"}
                          </p>
                        </div>
                      </div>
                      {currentSourceSku.processor !== currentTargetSku.processor && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <span className="px-2 py-1 rounded bg-amber-900/50 text-amber-300 text-xs">
                            ⚡ Processor change: {currentSourceSku.processor} → {currentTargetSku.processor}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Generation</label>
                      <select
                        value={generation}
                        onChange={(e) => setGeneration(e.target.value as "Gen1" | "Gen2")}
                        className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Gen1">Gen1</option>
                        <option value="Gen2">Gen2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Data Disks</label>
                      <select
                        value={dataDisksCount}
                        onChange={(e) => setDataDisksCount(parseInt(e.target.value))}
                        className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      >
                        {[0, 1, 2, 4, 8, 16, 32].map((n) => (
                          <option key={n} value={n}>{n} disk{n !== 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gray-800/50 w-full">
                        <input
                          type="checkbox"
                          checked={hasUltraSSD}
                          onChange={(e) => setHasUltraSSD(e.target.checked)}
                          className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm">Has Ultra SSD</span>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Resize OS Disk */}
            {actionType === "ResizeOSDisk" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <HardDrive className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Resize OS Disk</h2>
                    <p className="text-sm text-gray-400">Expand OS disk capacity</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Operating System</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { family: "Linux" as const, icon: "🐧", desc: "Ubuntu, RHEL, etc." },
                        { family: "Windows" as const, icon: "🪟", desc: "Windows Server" },
                      ].map(({ family, icon, desc }) => (
                        <motion.button
                          key={family}
                          onClick={() => setOsFamily(family)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            osFamily === family
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-2xl">{icon}</span>
                          <p className="font-semibold mt-2">{family}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-sm text-gray-300">
                      {osFamily === "Linux"
                        ? "After resize, Linux will need to extend the partition and filesystem. Most modern images do this automatically on boot."
                        : "After resize, use Disk Management to extend the C: drive into the new unallocated space."}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Resize Data Disk */}
            {actionType === "ResizeDataDisk" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <ArrowUpRight className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Resize Data Disk</h2>
                    <p className="text-sm text-gray-400">Configure the disk to resize</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Operating System</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { family: "Linux" as const, icon: "🐧" },
                        { family: "Windows" as const, icon: "🪟" },
                      ].map(({ family, icon }) => (
                        <motion.button
                          key={family}
                          onClick={() => {
                            setOsFamily(family);
                            setDiskTopology("raw");
                          }}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            osFamily === family
                              ? "border-cyan-500 bg-cyan-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-xl">{icon}</span>
                          <p className="font-medium mt-1">{family}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Disk Topology</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {topologies.map((t) => (
                        <motion.button
                          key={t.value}
                          onClick={() => setDiskTopology(t.value as DiskTopology)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            diskTopology === t.value
                              ? "border-cyan-500 bg-cyan-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <p className="font-medium text-sm">{t.label}</p>
                          <p className="text-xs text-gray-500">{t.description}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {osFamily === "Linux" && diskTopology === "lvm" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Volume Group</label>
                      <input
                        type="text"
                        value={volumeGroup}
                        onChange={(e) => setVolumeGroup(e.target.value)}
                        placeholder="vgdata"
                        className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Detach Disk */}
            {actionType === "DetachDisk" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Trash2 className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Detach Disk</h2>
                    <p className="text-sm text-gray-400">Configure the disk to detach</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Operating System</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { family: "Linux" as const, icon: "🐧" },
                        { family: "Windows" as const, icon: "🪟" },
                      ].map(({ family, icon }) => (
                        <motion.button
                          key={family}
                          onClick={() => {
                            setOsFamily(family);
                            setDiskTopology("raw");
                          }}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            osFamily === family
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-xl">{icon}</span>
                          <p className="font-medium mt-1">{family}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Disk Topology</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {topologies.map((t) => (
                        <motion.button
                          key={t.value}
                          onClick={() => setDiskTopology(t.value as DiskTopology)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            diskTopology === t.value
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <p className="font-medium text-sm">{t.label}</p>
                          <p className="text-xs text-gray-500">{t.description}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {osFamily === "Linux" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Mount Point</label>
                        <input
                          type="text"
                          value={mountPoint}
                          onChange={(e) => setMountPoint(e.target.value)}
                          placeholder="/mnt/data"
                          className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      {diskTopology === "lvm" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Volume Group</label>
                          <input
                            type="text"
                            value={volumeGroup}
                            onChange={(e) => setVolumeGroup(e.target.value)}
                            placeholder="vgdata"
                            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {osFamily === "Windows" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Drive Letter</label>
                      <select
                        value={driveLetter}
                        onChange={(e) => setDriveLetter(e.target.value)}
                        className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                      >
                        {["D", "E", "F", "G", "H", "I", "J", "K"].map((letter) => (
                          <option key={letter} value={letter}>{letter}:</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {["lvm", "raid0", "raid1", "raid5", "storage-spaces", "striped", "mirrored"].includes(diskTopology) && (
                    <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-4">
                      <p className="text-amber-300 text-sm font-medium">⚠️ Warning</p>
                      <p className="text-sm text-gray-300 mt-1">
                        {diskTopology === "lvm" && "This disk is part of an LVM volume group. Detaching may cause data loss."}
                        {diskTopology === "raid0" && "RAID 0 has no redundancy. Detaching this disk will destroy ALL data."}
                        {(diskTopology === "raid1" || diskTopology === "mirrored") && "Detaching will leave the array degraded with no redundancy."}
                        {diskTopology === "raid5" && "RAID 5 will enter degraded mode. Another failure will cause data loss."}
                        {(diskTopology === "storage-spaces" || diskTopology === "striped") && "This disk is part of a storage pool. Detaching may cause data loss."}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Redeploy VM */}
            {actionType === "RedeployVM" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <RefreshCw className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Redeploy VM</h2>
                    <p className="text-sm text-gray-400">Move VM to a new Azure host</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current SKU</label>
                    <select
                      value={sourceSku}
                      onChange={(e) => setSourceSku(e.target.value)}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    >
                      {skus.map((sku) => (
                        <option key={sku.name} value={sku.name}>
                          [{sku.processor}] {sku.family} • {sku.name} • {sku.tempDiskGB > 0 ? `${sku.tempDiskGB}GB temp` : "No temp disk"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentSourceSku && currentSourceSku.tempDiskGB > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasTempDiskData}
                          onChange={(e) => setHasTempDiskData(e.target.checked)}
                          className="w-5 h-5 mt-0.5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500"
                        />
                        <div>
                          <span className="font-medium">Temp disk has important data</span>
                          <p className="text-sm text-gray-400 mt-1">
                            Your SKU has a {currentSourceSku.tempDiskGB}GB temp disk. Check this if you have pagefile, swap, or application data on it.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="bg-purple-900/20 border border-purple-800 rounded-xl p-4">
                    <p className="text-sm text-gray-300">
                      Redeploy moves your VM to a new physical host. This is useful when experiencing host-level issues.
                      The VM will restart and <strong>all temp disk data will be lost</strong>.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Enable Encryption */}
            {actionType === "EnableEncryption" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Shield className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Disk Encryption</h2>
                    <p className="text-sm text-gray-400">Enable or disable Azure Disk Encryption</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Operation</label>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        onClick={() => setEncryptionOperation("enable")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          encryptionOperation === "enable"
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="font-semibold">🔒 Enable</p>
                        <p className="text-xs text-gray-400">Encrypt disks</p>
                      </motion.button>
                      <motion.button
                        onClick={() => setEncryptionOperation("disable")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          encryptionOperation === "disable"
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="font-semibold">🔓 Disable</p>
                        <p className="text-xs text-gray-400">Remove encryption</p>
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Target Disks</label>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        onClick={() => setEncryptionTarget("os")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          encryptionTarget === "os"
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="font-semibold">OS Disk</p>
                        <p className="text-xs text-gray-400">System drive only</p>
                      </motion.button>
                      <motion.button
                        onClick={() => setEncryptionTarget("all")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          encryptionTarget === "all"
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="font-semibold">All Disks</p>
                        <p className="text-xs text-gray-400">OS + Data disks</p>
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Operating System</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { family: "Linux" as const, icon: "🐧", desc: "dm-crypt/LUKS" },
                        { family: "Windows" as const, icon: "🪟", desc: "BitLocker" },
                      ].map(({ family, icon, desc }) => (
                        <motion.button
                          key={family}
                          onClick={() => setOsFamily(family)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            osFamily === family
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-2xl">{icon}</span>
                          <p className="font-semibold mt-2">{family}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-indigo-900/20 border border-indigo-800 rounded-xl p-4">
                    <p className="text-sm text-gray-300">
                      Azure Disk Encryption uses {osFamily === "Windows" ? "BitLocker" : "dm-crypt"} to encrypt disks.
                      The VM will <strong>restart during the process</strong> and encryption may take 1-2 hours depending on disk size.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Change Availability Zone */}
            {actionType === "ChangeZone" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-rose-500/20">
                    <MapPin className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Change Availability Zone</h2>
                    <p className="text-sm text-gray-400">Move VM to a different zone</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Deployment</label>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        onClick={() => setIsZonalVM(true)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isZonalVM ? "border-rose-500 bg-rose-500/10" : "border-gray-700 hover:border-gray-600"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="font-semibold">Zonal VM</p>
                        <p className="text-xs text-gray-400">Already in a zone</p>
                      </motion.button>
                      <motion.button
                        onClick={() => setIsZonalVM(false)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          !isZonalVM ? "border-rose-500 bg-rose-500/10" : "border-gray-700 hover:border-gray-600"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="font-semibold">Regional VM</p>
                        <p className="text-xs text-gray-400">No zone assigned</p>
                      </motion.button>
                    </div>
                  </div>

                  <div className="bg-rose-900/20 border border-rose-800 rounded-xl p-4">
                    <p className="text-sm font-medium text-rose-300 mb-2">
                      {isZonalVM ? "Zone-to-Zone Migration" : "Regional to Zonal Migration"}
                    </p>
                    <p className="text-sm text-gray-300">
                      {isZonalVM
                        ? "Moving a VM between zones (e.g., Zone 1 → Zone 2) is a manual process. There is no direct portal option or Azure Site Recovery path for zone-to-zone moves."
                        : "Converting a regional VM to zonal is fully supported. Use the Azure portal's 'Edit Availability' feature or Azure Site Recovery for minimal downtime."}
                    </p>
                    <ul className="text-sm text-gray-300 list-disc list-inside mt-2 space-y-1">
                      {isZonalVM ? (
                        <>
                          <li>Create snapshots of all disks</li>
                          <li>Delete the VM (keep disks)</li>
                          <li>Recreate VM in target zone from snapshots</li>
                          <li>Expect significant downtime</li>
                        </>
                      ) : (
                        <>
                          <li>Use portal: Edit Availability → Select target zone</li>
                          <li>New NIC and Public IP will be created</li>
                          <li>Delete original VM after migration</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Cross-Region Move */}
            {actionType === "CrossRegionMove" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-teal-500/20">
                    <Globe className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Cross-Region Move</h2>
                    <p className="text-sm text-gray-400">Migrate VM to another Azure region</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current SKU</label>
                    <select
                      value={sourceSku}
                      onChange={(e) => setSourceSku(e.target.value)}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none"
                    >
                      {skus.map((sku) => (
                        <option key={sku.name} value={sku.name}>
                          [{sku.processor}] {sku.family} • {sku.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data Disks</label>
                    <select
                      value={dataDisksCount}
                      onChange={(e) => setDataDisksCount(parseInt(e.target.value))}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none"
                    >
                      {[0, 1, 2, 4, 8, 16].map((n) => (
                        <option key={n} value={n}>{n} data disk{n !== 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-teal-900/20 border border-teal-800 rounded-xl p-4">
                    <p className="text-sm text-gray-300 mb-3">
                      Cross-region move involves copying disk snapshots to the target region and recreating the VM. Consider:
                    </p>
                    <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                      <li>All IP addresses will change</li>
                      <li>VNet and networking must be recreated</li>
                      <li>Downtime depends on disk sizes (30+ min)</li>
                      <li>Data transfer costs may apply</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Stop VM */}
            {actionType === "StopVM" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Power className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Stop VM</h2>
                    <p className="text-sm text-gray-400">Stop the VM (hardware stays allocated)</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current SKU</label>
                    <select
                      value={sourceSku}
                      onChange={(e) => setSourceSku(e.target.value)}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    >
                      {skus.map((sku) => (
                        <option key={sku.name} value={sku.name}>
                          [{sku.processor}] {sku.family} • {sku.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-4">
                    <p className="text-sm font-medium text-orange-300 mb-2">Stop vs Deallocate</p>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>Stop</strong> keeps the hardware allocated - you continue to pay for compute.
                    </p>
                    <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                      <li>Temp disk data is <strong>preserved</strong></li>
                      <li>Dynamic IPs remain assigned</li>
                      <li>Faster restart time</li>
                      <li>You continue to pay for the VM</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Deallocate VM */}
            {actionType === "DeallocateVM" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Square className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Deallocate VM</h2>
                    <p className="text-sm text-gray-400">Stop and release hardware resources</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current SKU</label>
                    <select
                      value={sourceSku}
                      onChange={(e) => setSourceSku(e.target.value)}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                    >
                      {skus.map((sku) => (
                        <option key={sku.name} value={sku.name}>
                          [{sku.processor}] {sku.family} • {sku.name} • {sku.tempDiskGB > 0 ? `${sku.tempDiskGB}GB temp` : "No temp disk"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentSourceSku && currentSourceSku.tempDiskGB > 0 && (
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
                      <p className="text-red-300 font-medium mb-2">⚠️ Temp Disk Warning</p>
                      <p className="text-sm text-gray-300">
                        Your SKU has a <strong>{currentSourceSku.tempDiskGB}GB temp disk</strong>.
                        All data on the temp disk (D: on Windows, /dev/sdb on Linux) will be <strong>permanently lost</strong>.
                      </p>
                    </div>
                  )}

                  <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                    <p className="text-sm font-medium text-red-300 mb-2">Deallocate Impacts</p>
                    <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                      <li>Temp disk data is <strong>lost</strong></li>
                      <li>Dynamic public IPs will change</li>
                      <li>No compute charges while deallocated</li>
                      <li>May take longer to start (hardware allocation)</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Capture VM */}
            {actionType === "CaptureVM" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-violet-500/20">
                    <Camera className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Capture VM</h2>
                    <p className="text-sm text-gray-400">Create an image from this VM</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Operating System</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { family: "Linux" as const, icon: "🐧", desc: "waagent -deprovision" },
                        { family: "Windows" as const, icon: "🪟", desc: "sysprep" },
                      ].map(({ family, icon, desc }) => (
                        <motion.button
                          key={family}
                          onClick={() => setOsFamily(family)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            osFamily === family
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-2xl">{icon}</span>
                          <p className="font-semibold mt-2">{family}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Capture Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        onClick={() => setGeneralizeVM(true)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          generalizeVM ? "border-violet-500 bg-violet-500/10" : "border-gray-700 hover:border-gray-600"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="font-semibold">Generalized</p>
                        <p className="text-xs text-gray-400">For creating new VMs</p>
                      </motion.button>
                      <motion.button
                        onClick={() => setGeneralizeVM(false)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          !generalizeVM ? "border-violet-500 bg-violet-500/10" : "border-gray-700 hover:border-gray-600"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="font-semibold">Specialized</p>
                        <p className="text-xs text-gray-400">Clone this exact VM</p>
                      </motion.button>
                    </div>
                  </div>

                  {generalizeVM && (
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
                      <p className="text-red-300 font-medium mb-2">⚠️ Critical Warning</p>
                      <p className="text-sm text-gray-300 mb-2">
                        Generalization requires running <strong>{osFamily === "Windows" ? "sysprep" : "waagent -deprovision+user"}</strong>.
                        This will:
                      </p>
                      <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                        <li>Remove machine-specific information</li>
                        <li>Reset the administrator/root account</li>
                        <li><strong>Make the source VM unusable!</strong></li>
                      </ul>
                    </div>
                  )}

                  {!generalizeVM && (
                    <div className="bg-violet-900/20 border border-violet-800 rounded-xl p-4">
                      <p className="text-sm text-gray-300">
                        Specialized images keep the VM identity. The source VM remains usable after capture.
                        New VMs from this image will have the same hostname, users, and configuration.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Add NIC */}
            {actionType === "AddNIC" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-sky-500/20">
                    <Network className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Add Network Interface</h2>
                    <p className="text-sm text-gray-400">Attach a new NIC to the VM</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current SKU</label>
                    <select
                      value={sourceSku}
                      onChange={(e) => setSourceSku(e.target.value)}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none"
                    >
                      {skus.map((sku) => (
                        <option key={sku.name} value={sku.name}>
                          [{sku.processor}] {sku.family} • {sku.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current NIC Count</label>
                    <select
                      value={currentNicCount}
                      onChange={(e) => setCurrentNicCount(parseInt(e.target.value))}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>{n} NIC{n !== 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-sky-900/20 border border-sky-800 rounded-xl p-4">
                    <p className="text-sm font-medium text-sky-300 mb-2">Requirements</p>
                    <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                      <li>VM must be <strong>stopped (deallocated)</strong> to add a NIC</li>
                      <li>Check SKU supports the number of NICs needed</li>
                      <li>New NIC must be in a compatible subnet</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Remove NIC */}
            {actionType === "RemoveNIC" && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-slate-500/20">
                    <Network className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Remove Network Interface</h2>
                    <p className="text-sm text-gray-400">Detach a NIC from the VM</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current NIC Count</label>
                    <select
                      value={currentNicCount}
                      onChange={(e) => setCurrentNicCount(parseInt(e.target.value))}
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-slate-500 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>{n} NIC{n !== 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>

                  {currentNicCount === 1 && (
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
                      <p className="text-red-300 font-medium">⚠️ Cannot remove the primary NIC</p>
                      <p className="text-sm text-gray-300 mt-1">
                        A VM must have at least one network interface attached.
                      </p>
                    </div>
                  )}

                  {currentNicCount > 1 && (
                    <div className="bg-slate-900/20 border border-slate-700 rounded-xl p-4">
                      <p className="text-sm font-medium text-slate-300 mb-2">Requirements</p>
                      <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                        <li>VM must be <strong>stopped (deallocated)</strong> to remove a NIC</li>
                        <li>Cannot remove the primary NIC</li>
                        <li>Applications using this NIC will lose connectivity</li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              <motion.button
                onClick={goBack}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-700"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </motion.button>
              <motion.button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-5 h-5" />
                Analyze Impact
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
