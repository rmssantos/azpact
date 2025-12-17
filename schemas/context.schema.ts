import { z } from "zod";

// LVM details (optional, for advanced analysis)
export const LVMInfoSchema = z.object({
  isPV: z.boolean(),
  volumeGroup: z.string().optional(),
  logicalVolumes: z.array(z.string()).optional(),
});

// RAID details (optional)
export const RAIDInfoSchema = z.object({
  isMember: z.boolean(),
  arrayName: z.string().optional(),
  level: z.enum(["0", "1", "5", "6", "10"]).optional(),
  canDegrade: z.boolean().optional(),
});

// Extended disk schema (RFC-001 compliant)
export const DiskSchema = z.object({
  // Identity
  lun: z.number().optional(), // LUN for data disks
  role: z.enum(["os", "data", "temp"]),

  // Size and type
  sizeGB: z.number(),
  type: z.enum([
    "Standard_LRS",
    "StandardSSD_LRS",
    "Premium_LRS",
    "UltraSSD_LRS",
  ]),

  // Topology (simple classification)
  topology: z
    .enum(["raw", "lvm", "raid", "storage-spaces", "dynamic", "striped", "mirrored"])
    .default("raw"),

  // Usage hint (for severity calculation)
  usage: z
    .enum(["boot", "app", "database", "cache", "backup", "unknown"])
    .default("unknown"),

  // Mount info
  isMounted: z.boolean().default(false),
  mountPoint: z.string().optional(),

  // Advanced topology details (optional)
  lvm: LVMInfoSchema.optional(),
  raid: RAIDInfoSchema.optional(),

  // Encryption
  isEncrypted: z.boolean().default(false),
});

// VM profile
export const VMProfileSchema = z.object({
  sku: z.string(),
  generation: z.enum(["Gen1", "Gen2"]),
  zone: z.string().optional(),
  region: z.string().optional(),
});

// OS configuration
export const OSConfigSchema = z.object({
  family: z.enum(["Windows", "Linux"]),
  distro: z.string().optional(),
  version: z.string().optional(),
});

// Full VM context
export const VMContextSchema = z.object({
  vm: VMProfileSchema,
  os: OSConfigSchema,
  disks: z.array(DiskSchema),
});

// Action schema
export const ActionTypeSchema = z.enum([
  "ResizeVM",
  "ResizeOSDisk",
  "ResizeDataDisk",
  "DetachDisk",
  "RedeployVM",
  "EnableEncryption",
  "DisableEncryption",
  "ChangeZone",
  "CrossRegionMove",
]);

export const ActionSchema = z.object({
  type: ActionTypeSchema,
  targetSku: z.string().optional(),
  targetSizeGB: z.number().optional(),
  targetLun: z.number().optional(),
  encryptionTarget: z.enum(["os", "all"]).optional(),
  encryptionOperation: z.enum(["enable", "disable"]).optional(),
  targetZone: z.string().optional(),
  targetRegion: z.string().optional(),
});

export type LVMInfo = z.infer<typeof LVMInfoSchema>;
export type RAIDInfo = z.infer<typeof RAIDInfoSchema>;
export type Disk = z.infer<typeof DiskSchema>;
export type VMProfile = z.infer<typeof VMProfileSchema>;
export type OSConfig = z.infer<typeof OSConfigSchema>;
export type VMContext = z.infer<typeof VMContextSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type Action = z.infer<typeof ActionSchema>;
