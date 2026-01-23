import { SKUInfo } from "@/types";

export const skus: SKUInfo[] = [
  // ============================================
  // D-series v5 - Intel (General Purpose)
  // ============================================
  {
    name: "Standard_D2s_v5",
    family: "Dsv5",
    vCPUs: 2,
    memoryGB: 8,
    maxDataDisks: 4,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_D4s_v5",
    family: "Dsv5",
    vCPUs: 4,
    memoryGB: 16,
    maxDataDisks: 8,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_D8s_v5",
    family: "Dsv5",
    vCPUs: 8,
    memoryGB: 32,
    maxDataDisks: 16,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_D16s_v5",
    family: "Dsv5",
    vCPUs: 16,
    memoryGB: 64,
    maxDataDisks: 32,
    premiumIO: true,
    tempDiskGB: 0,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "Intel",
  },

  // ============================================
  // D-series v5 - AMD (General Purpose)
  // ============================================
  {
    name: "Standard_D2as_v5",
    family: "Dasv5",
    vCPUs: 2,
    memoryGB: 8,
    maxDataDisks: 4,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "AMD",
  },
  {
    name: "Standard_D4as_v5",
    family: "Dasv5",
    vCPUs: 4,
    memoryGB: 16,
    maxDataDisks: 8,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "AMD",
  },
  {
    name: "Standard_D8as_v5",
    family: "Dasv5",
    vCPUs: 8,
    memoryGB: 32,
    maxDataDisks: 16,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "AMD",
  },
  {
    name: "Standard_D16as_v5",
    family: "Dasv5",
    vCPUs: 16,
    memoryGB: 64,
    maxDataDisks: 32,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "AMD",
  },

  // ============================================
  // D-series v4 - Intel (with temp disk)
  // ============================================
  {
    name: "Standard_D2ds_v4",
    family: "Ddsv4",
    vCPUs: 2,
    memoryGB: 8,
    maxDataDisks: 4,
    tempDiskGB: 75,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_D4ds_v4",
    family: "Ddsv4",
    vCPUs: 4,
    memoryGB: 16,
    maxDataDisks: 8,
    tempDiskGB: 150,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_D8ds_v4",
    family: "Ddsv4",
    vCPUs: 8,
    memoryGB: 32,
    maxDataDisks: 16,
    tempDiskGB: 300,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },

  // ============================================
  // E-series v3 - Intel (Memory Optimized)
  // ============================================
  {
    name: "Standard_E2s_v3",
    family: "Esv3",
    vCPUs: 2,
    memoryGB: 16,
    maxDataDisks: 4,
    tempDiskGB: 32,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_E4s_v3",
    family: "Esv3",
    vCPUs: 4,
    memoryGB: 32,
    maxDataDisks: 8,
    tempDiskGB: 64,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_E8s_v3",
    family: "Esv3",
    vCPUs: 8,
    memoryGB: 64,
    maxDataDisks: 16,
    tempDiskGB: 128,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_E16s_v3",
    family: "Esv3",
    vCPUs: 16,
    memoryGB: 128,
    maxDataDisks: 32,
    tempDiskGB: 256,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },

  // ============================================
  // E-series v4 - Intel (Memory Optimized)
  // ============================================
  {
    name: "Standard_E2s_v4",
    family: "Esv4",
    vCPUs: 2,
    memoryGB: 16,
    maxDataDisks: 4,
    tempDiskGB: 32,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_E4s_v4",
    family: "Esv4",
    vCPUs: 4,
    memoryGB: 32,
    maxDataDisks: 8,
    tempDiskGB: 64,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_E8s_v4",
    family: "Esv4",
    vCPUs: 8,
    memoryGB: 64,
    maxDataDisks: 16,
    tempDiskGB: 128,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_E16s_v4",
    family: "Esv4",
    vCPUs: 16,
    memoryGB: 128,
    maxDataDisks: 32,
    tempDiskGB: 256,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },

  // ============================================
  // E-series v5 - Intel (Memory Optimized)
  // ============================================
  {
    name: "Standard_E2s_v5",
    family: "Esv5",
    vCPUs: 2,
    memoryGB: 16,
    maxDataDisks: 4,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_E4s_v5",
    family: "Esv5",
    vCPUs: 4,
    memoryGB: 32,
    maxDataDisks: 8,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_E8s_v5",
    family: "Esv5",
    vCPUs: 8,
    memoryGB: 64,
    maxDataDisks: 16,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "Intel",
  },

  // ============================================
  // E-series v5 - AMD (Memory Optimized)
  // ============================================
  {
    name: "Standard_E2as_v5",
    family: "Easv5",
    vCPUs: 2,
    memoryGB: 16,
    maxDataDisks: 4,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "AMD",
  },
  {
    name: "Standard_E4as_v5",
    family: "Easv5",
    vCPUs: 4,
    memoryGB: 32,
    maxDataDisks: 8,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "AMD",
  },
  {
    name: "Standard_E8as_v5",
    family: "Easv5",
    vCPUs: 8,
    memoryGB: 64,
    maxDataDisks: 16,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "AMD",
  },

  // ============================================
  // F-series v2 - Intel (Compute Optimized)
  // ============================================
  {
    name: "Standard_F2s_v2",
    family: "Fsv2",
    vCPUs: 2,
    memoryGB: 4,
    maxDataDisks: 4,
    tempDiskGB: 16,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_F4s_v2",
    family: "Fsv2",
    vCPUs: 4,
    memoryGB: 8,
    maxDataDisks: 8,
    tempDiskGB: 32,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_F8s_v2",
    family: "Fsv2",
    vCPUs: 8,
    memoryGB: 16,
    maxDataDisks: 16,
    tempDiskGB: 64,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },

  // ============================================
  // B-series - Intel (Burstable)
  // ============================================
  {
    name: "Standard_B2s",
    family: "Bs",
    vCPUs: 2,
    memoryGB: 4,
    maxDataDisks: 4,
    tempDiskGB: 8,
    premiumIO: true,
    acceleratedNetworking: false,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_B2ms",
    family: "Bms",
    vCPUs: 2,
    memoryGB: 8,
    maxDataDisks: 4,
    tempDiskGB: 16,
    premiumIO: true,
    acceleratedNetworking: false,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_B4ms",
    family: "Bms",
    vCPUs: 4,
    memoryGB: 16,
    maxDataDisks: 8,
    tempDiskGB: 32,
    premiumIO: true,
    acceleratedNetworking: false,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },

  // ============================================
  // L-series v2 - AMD (Storage Optimized)
  // ============================================
  {
    name: "Standard_L8s_v2",
    family: "Lsv2",
    vCPUs: 8,
    memoryGB: 64,
    maxDataDisks: 16,
    tempDiskGB: 80,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "AMD",
  },
  {
    name: "Standard_L16s_v2",
    family: "Lsv2",
    vCPUs: 16,
    memoryGB: 128,
    maxDataDisks: 32,
    tempDiskGB: 160,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "AMD",
  },

  // ============================================
  // NC-series v3 - Intel + NVIDIA GPU
  // ============================================
  {
    name: "Standard_NC6s_v3",
    family: "NCsv3",
    vCPUs: 6,
    memoryGB: 112,
    maxDataDisks: 12,
    tempDiskGB: 736,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },
  {
    name: "Standard_NC12s_v3",
    family: "NCsv3",
    vCPUs: 12,
    memoryGB: 224,
    maxDataDisks: 24,
    tempDiskGB: 1474,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen1", "Gen2"],
    processor: "Intel",
  },

  // ============================================
  // D-series pls v5 - ARM (General Purpose)
  // ============================================
  {
    name: "Standard_D2pls_v5",
    family: "Dplsv5",
    vCPUs: 2,
    memoryGB: 4,
    maxDataDisks: 4,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "ARM",
  },
  {
    name: "Standard_D4pls_v5",
    family: "Dplsv5",
    vCPUs: 4,
    memoryGB: 8,
    maxDataDisks: 8,
    tempDiskGB: 0,
    premiumIO: true,
    acceleratedNetworking: true,
    generation: ["Gen2"],
    processor: "ARM",
  },
];

// SKU lookup map for O(1) access - created once at module load
const skuMap = new Map<string, SKUInfo>(skus.map((s) => [s.name, s]));

/**
 * Get SKU info by name with O(1) lookup performance.
 */
export function getSKU(name: string): SKUInfo | undefined {
  return skuMap.get(name);
}

export function getSKUsByFamily(family: string): SKUInfo[] {
  return skus.filter((s) => s.family === family);
}

export function getSKUsByProcessor(processor: "Intel" | "AMD" | "ARM"): SKUInfo[] {
  return skus.filter((s) => s.processor === processor);
}
