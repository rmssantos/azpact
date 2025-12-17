/**
 * Parser for Azure CLI VM output (az vm show --output json)
 * Extracts VM configuration to populate AZpact forms
 */

import { VMContext, DiskConfig } from "@/types";

// Azure VM JSON structure (simplified - only fields we need)
interface AzureVMJson {
  name: string;
  location: string;
  zones?: string[];
  hardwareProfile: {
    vmSize: string;
  };
  storageProfile: {
    osDisk: {
      name: string;
      diskSizeGb?: number;
      managedDisk?: {
        storageAccountType?: string;
        id?: string;
      };
      osType?: string;
    };
    dataDisks: Array<{
      lun: number;
      name: string;
      diskSizeGb?: number;
      managedDisk?: {
        storageAccountType?: string;
        id?: string;
      };
    }>;
    imageReference?: {
      publisher?: string;
      offer?: string;
      sku?: string;
      version?: string;
    };
  };
  osProfile?: {
    computerName?: string;
    linuxConfiguration?: object;
    windowsConfiguration?: object;
  };
  networkProfile?: {
    networkInterfaces: Array<{
      id: string;
      primary?: boolean;
    }>;
  };
  securityProfile?: {
    securityType?: string;
    uefiSettings?: {
      secureBootEnabled?: boolean;
      vTpmEnabled?: boolean;
    };
  };
}

export interface ParsedVMProfile {
  name: string;
  location: string;
  sku: string;
  osFamily: "Linux" | "Windows";
  osDistro?: string;
  osVersion?: string;
  generation: "Gen1" | "Gen2";
  zonal: boolean;
  zone?: string;
  disks: {
    os: {
      name: string;
      sizeGB: number;
      type: string;
    };
    data: Array<{
      lun: number;
      name: string;
      sizeGB: number;
      type: string;
    }>;
  };
  nicCount: number;
  security?: {
    type: string;
    secureBoot: boolean;
    vTpm: boolean;
  };
}

export interface ProfileParseResult {
  success: boolean;
  profile?: ParsedVMProfile;
  error?: string;
}

/**
 * Parse Azure VM JSON output from `az vm show`
 */
export function parseAzureVMJson(jsonString: string): ProfileParseResult {
  try {
    const data = JSON.parse(jsonString) as AzureVMJson;

    // Validate required fields
    if (!data.hardwareProfile?.vmSize) {
      return { success: false, error: "Missing hardwareProfile.vmSize" };
    }
    if (!data.storageProfile?.osDisk) {
      return { success: false, error: "Missing storageProfile.osDisk" };
    }

    // Determine OS family
    let osFamily: "Linux" | "Windows" = "Linux";
    if (data.osProfile?.windowsConfiguration) {
      osFamily = "Windows";
    } else if (data.storageProfile.osDisk.osType) {
      osFamily = data.storageProfile.osDisk.osType.toLowerCase() === "windows" ? "Windows" : "Linux";
    }

    // Extract OS distro and version from imageReference
    let osDistro: string | undefined;
    let osVersion: string | undefined;
    const imageRef = data.storageProfile.imageReference;
    if (imageRef) {
      // Parse publisher/offer for distro name
      if (imageRef.publisher?.toLowerCase().includes("canonical")) {
        osDistro = "Ubuntu";
      } else if (imageRef.publisher?.toLowerCase().includes("redhat")) {
        osDistro = "RHEL";
      } else if (imageRef.publisher?.toLowerCase().includes("suse")) {
        osDistro = "SUSE";
      } else if (imageRef.publisher?.toLowerCase().includes("debian")) {
        osDistro = "Debian";
      } else if (imageRef.publisher?.toLowerCase().includes("microsoftwindowsserver")) {
        osDistro = "Windows Server";
      } else if (imageRef.offer) {
        // Use offer as fallback
        osDistro = imageRef.offer.replace(/-/g, " ");
      }

      // Extract version from SKU (e.g., "22_04-lts-gen2" -> "22.04 LTS")
      if (imageRef.sku) {
        const skuLower = imageRef.sku.toLowerCase();
        const versionMatch = skuLower.match(/(\d+)[_.](\d+)/);
        if (versionMatch) {
          osVersion = `${versionMatch[1]}.${versionMatch[2]}`;
          if (skuLower.includes("lts")) osVersion += " LTS";
        }
      }
    }

    // Determine generation - check imageReference.sku first, then fallback to VM SKU heuristic
    const sku = data.hardwareProfile.vmSize;
    let generation: "Gen1" | "Gen2" = "Gen1";
    if (imageRef?.sku?.toLowerCase().includes("gen2")) {
      generation = "Gen2";
    } else if (imageRef?.sku?.toLowerCase().includes("gen1")) {
      generation = "Gen1";
    } else if (sku.includes("_v")) {
      // Fallback: v-series SKUs typically support Gen2
      generation = "Gen2";
    }

    // Parse disks
    const osDisk = data.storageProfile.osDisk;
    const dataDisks = data.storageProfile.dataDisks || [];

    // Map storage account type to our format
    const mapStorageType = (type?: string): DiskConfig["type"] => {
      if (!type) return "Premium_LRS";
      if (type.includes("UltraSSD")) return "UltraSSD_LRS";
      if (type.includes("Premium")) return "Premium_LRS";
      if (type.includes("StandardSSD")) return "StandardSSD_LRS";
      return "Standard_LRS";
    };

    // Parse security profile
    const securityProfile = data.securityProfile;
    const security = securityProfile?.securityType ? {
      type: securityProfile.securityType,
      secureBoot: securityProfile.uefiSettings?.secureBootEnabled ?? false,
      vTpm: securityProfile.uefiSettings?.vTpmEnabled ?? false,
    } : undefined;

    const profile: ParsedVMProfile = {
      name: data.name || "Unknown VM",
      location: data.location || "unknown",
      sku: data.hardwareProfile.vmSize,
      osFamily,
      osDistro,
      osVersion,
      generation,
      zonal: !!data.zones && data.zones.length > 0,
      zone: data.zones?.[0],
      disks: {
        os: {
          name: osDisk.name || "os-disk",
          sizeGB: osDisk.diskSizeGb || 128,
          type: mapStorageType(osDisk.managedDisk?.storageAccountType),
        },
        data: dataDisks.map((d) => ({
          lun: d.lun,
          name: d.name || `data-disk-${d.lun}`,
          sizeGB: d.diskSizeGb || 128,
          type: mapStorageType(d.managedDisk?.storageAccountType),
        })),
      },
      nicCount: data.networkProfile?.networkInterfaces?.length || 1,
      security,
    };

    return { success: true, profile };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return { success: false, error: "Invalid JSON format. Please paste the complete output from 'az vm show'." };
    }
    return { success: false, error: `Parse error: ${e instanceof Error ? e.message : "Unknown error"}` };
  }
}

/**
 * Convert parsed profile to VMContext for engine evaluation
 */
export function profileToVMContext(profile: ParsedVMProfile): VMContext {
  const disks: DiskConfig[] = [
    {
      lun: 0,
      name: profile.disks.os.name,
      role: "os",
      sizeGB: profile.disks.os.sizeGB,
      type: profile.disks.os.type as DiskConfig["type"],
    },
    ...profile.disks.data.map((d) => ({
      lun: d.lun,
      name: d.name,
      role: "data" as const,
      sizeGB: d.sizeGB,
      type: d.type as DiskConfig["type"],
    })),
  ];

  return {
    vm: {
      sku: profile.sku,
      generation: profile.generation,
      zonal: profile.zonal,
      zone: profile.zone,
    },
    os: {
      family: profile.osFamily,
      distro: profile.osDistro || (profile.osFamily === "Linux" ? "Linux" : "Windows Server"),
      version: profile.osVersion || "Unknown",
    },
    disks,
  };
}

/**
 * Generate the Azure CLI command for the user to run
 */
export function getAzureCliCommand(resourceGroup?: string, vmName?: string): string {
  if (resourceGroup && vmName) {
    return `az vm show -g ${resourceGroup} -n ${vmName} --output json`;
  }
  return "az vm show -g <resource-group> -n <vm-name> --output json";
}
