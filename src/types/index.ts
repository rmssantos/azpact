// VM Configuration Types
export interface VMConfig {
  readonly sku: string;
  readonly generation: "Gen1" | "Gen2";
  readonly zonal: boolean;
  readonly zone?: string;
}

export interface OSConfig {
  readonly family: "Linux" | "Windows";
  readonly distro: string;
  readonly version: string;
}

// Linux topologies
export type LinuxTopology = "raw" | "lvm" | "raid0" | "raid1" | "raid5";
// Windows topologies
export type WindowsTopology = "raw" | "storage-spaces" | "striped" | "mirrored";
// Combined
export type DiskTopology = LinuxTopology | WindowsTopology;

export interface DiskConfig {
  lun: number;
  name: string;
  role: "os" | "data" | "temp";
  sizeGB: number;
  type: "Premium_LRS" | "StandardSSD_LRS" | "Standard_LRS" | "UltraSSD_LRS";
  topology?: DiskTopology;
  vg?: string;
  lv?: string;
  mount?: string;
  driveLetter?: string;
}

export interface VMContext {
  vm: VMConfig;
  os: OSConfig;
  disks: DiskConfig[];
}

// Action Types
export type ActionType =
  | "ResizeVM"
  | "ResizeOSDisk"
  | "ResizeDataDisk"
  | "DetachDisk"
  | "RedeployVM"
  | "EnableEncryption"
  | "ChangeZone"
  | "CrossRegionMove"
  | "StopVM"
  | "DeallocateVM"
  | "CaptureVM"
  | "AddNIC"
  | "RemoveNIC"
  | "RestoreVM"
  | "SwapOSDisk";

export interface Action {
  type: ActionType;
  targetSku?: string;
  targetLun?: number;
  targetSizeGB?: number;
  // Encryption-specific options
  encryptionOperation?: "enable" | "disable";
  encryptionTarget?: "os" | "all";
  // Capture-specific options
  generalize?: boolean;
  // NIC-specific options
  nicCount?: number;
  // Restore-specific options
  restoreType?: "newVM" | "replaceExisting" | "disksOnly";
  // Swap OS Disk options
  swapSource?: "snapshot" | "disk" | "backup";
}

// Impact Types
export type RebootLevel = "none" | "possible" | "likely" | "guaranteed";
export type DowntimeLevel = "none" | "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface InfraImpact {
  reboot: RebootLevel;
  downtime: DowntimeLevel;
  reason: string;
}

export interface GuestImpact {
  risk: RiskLevel;
  reason: string;
  affectedComponents: string[];
}

export interface Mitigation {
  id: string;
  title: string;
  description: string;
  phase: "before" | "during" | "after";
  required: boolean;
  platforms: ("Windows" | "Linux" | "all")[];
  docUrl?: string;
  steps?: string[];
}

export interface ImpactReport {
  blocked: boolean;
  blockerReason?: string;
  infra: InfraImpact;
  guest: GuestImpact;
  mitigations: Mitigation[];
  explanation: string;
  matchedRules: string[];
}

// Rule Types
export interface RuleCondition {
  field: string;
  operator: "eq" | "ne" | "in" | "nin" | "exists" | "notExists" | "gt" | "gte" | "lt" | "lte" | "matches";
  value: unknown;
}

export interface RuleSource {
  title: string;
  url: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: "rule" | "blocker" | "override";
  layer: "infra" | "guest";
  actions: ActionType[];
  conditions: RuleCondition[];
  overrideTargets?: string[];
  impact: {
    reboot?: RebootLevel;
    downtime?: DowntimeLevel;
    risk?: RiskLevel;
    reason: string;
    affectedComponents?: string[];
  };
  mitigations: string[];
  confidence?: "high" | "medium" | "low";
  sources?: RuleSource[];
  tags?: string[];
  version?: string;
  deprecated?: boolean;
  deprecatedBy?: string;
  deprecatedAt?: string;
}

// Legacy alias for backwards compatibility during migration
export type RuleCategory = "infra" | "guest" | "blocker";

// SKU and Image Types
export type ProcessorType = "Intel" | "AMD" | "ARM";

export interface SKUInfo {
  readonly name: string;
  readonly family: string;
  readonly vCPUs: number;
  readonly memoryGB: number;
  readonly maxDataDisks: number;
  readonly tempDiskGB: number;
  readonly premiumIO: boolean;
  readonly acceleratedNetworking: boolean;
  readonly generation: readonly ("Gen1" | "Gen2")[];
  readonly processor: ProcessorType;
}

export interface OSImage {
  readonly id: string;
  readonly family: "Linux" | "Windows";
  readonly distro: string;
  readonly version: string;
  readonly displayName: string;
}
