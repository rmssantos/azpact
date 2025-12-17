// VM Configuration Types
export interface VMConfig {
  sku: string;
  generation: "Gen1" | "Gen2";
  zonal: boolean;
  zone?: string;
}

export interface OSConfig {
  family: "Linux" | "Windows";
  distro: string;
  version: string;
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
  | "CrossRegionMove";

export interface Action {
  type: ActionType;
  targetSku?: string;
  targetLun?: number;
  targetSizeGB?: number;
  // Encryption-specific options
  encryptionOperation?: "enable" | "disable";
  encryptionTarget?: "os" | "all";
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
  required: boolean;
  docUrl?: string;
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
  operator: "eq" | "ne" | "in" | "notIn" | "exists" | "gt" | "lt";
  value: unknown;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: "infra" | "guest" | "blocker";
  actions: ActionType[];
  conditions: RuleCondition[];
  impact?: {
    reboot?: RebootLevel;
    downtime?: DowntimeLevel;
    risk?: RiskLevel;
    reason: string;
    affectedComponents?: string[];
  };
  mitigations?: string[];
}

// SKU and Image Types
export type ProcessorType = "Intel" | "AMD" | "ARM";

export interface SKUInfo {
  name: string;
  family: string;
  vCPUs: number;
  memoryGB: number;
  maxDataDisks: number;
  tempDiskGB: number;
  premiumIO: boolean;
  acceleratedNetworking: boolean;
  generation: ("Gen1" | "Gen2")[];
  processor: ProcessorType;
}

export interface OSImage {
  id: string;
  family: "Linux" | "Windows";
  distro: string;
  version: string;
  displayName: string;
}
