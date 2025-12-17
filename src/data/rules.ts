import { Rule } from "@/types";

export const rules: Rule[] = [
  // ============================================
  // BLOCKER RULES
  // ============================================
  {
    id: "blocker-gen2-to-gen1",
    name: "Generation Downgrade Blocked",
    description: "Cannot resize from Gen2 to Gen1-only SKU",
    category: "blocker",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.generation", operator: "eq", value: "Gen2" },
      { field: "vm.generation", operator: "notIn", value: "targetSku.generation" },
    ],
    impact: {
      reason: "Target SKU only supports Gen1 VMs. Your current VM is Gen2 and cannot be downgraded to Gen1.",
    },
  },
  {
    id: "blocker-exceed-max-disks",
    name: "Max Data Disks Exceeded",
    description: "Target SKU has fewer max data disks than currently attached",
    category: "blocker",
    actions: ["ResizeVM"],
    conditions: [
      { field: "disks.count", operator: "gt", value: "targetSku.maxDataDisks" },
    ],
    impact: {
      reason:
        "Target SKU supports fewer data disks than currently attached. Detach disks first.",
    },
  },
  {
    id: "blocker-ultra-ssd-not-supported",
    name: "Ultra SSD Not Supported",
    description: "Target SKU does not support Ultra SSD",
    category: "blocker",
    actions: ["ResizeVM"],
    conditions: [
      { field: "disks.hasUltraSSD", operator: "eq", value: true },
      { field: "targetSku.premiumIO", operator: "eq", value: false },
    ],
    impact: {
      reason:
        "Target SKU does not support Ultra SSD. Detach Ultra SSD disks or choose a different SKU.",
    },
  },
  {
    id: "blocker-temp-disk-to-no-temp-disk",
    name: "Temp Disk Configuration Mismatch",
    description: "Cannot resize from VM with temp disk to VM without temp disk",
    category: "blocker",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.hasTempDisk", operator: "eq", value: true },
      { field: "targetSku.tempDiskGB", operator: "eq", value: 0 },
    ],
    impact: {
      reason:
        "Cannot resize from a VM with local temp disk to a VM without temp disk. Azure blocks this to prevent pagefile/swap issues. Workaround: Create a snapshot, then create a new VM from that snapshot with the target size.",
    },
  },
  {
    id: "blocker-no-temp-disk-to-temp-disk",
    name: "Temp Disk Configuration Mismatch",
    description: "Cannot resize from VM without temp disk to VM with temp disk",
    category: "blocker",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.hasTempDisk", operator: "eq", value: false },
      { field: "targetSku.tempDiskGB", operator: "gt", value: 0 },
    ],
    impact: {
      reason:
        "Cannot resize from a VM without local temp disk to a VM with temp disk. Azure blocks this due to storage configuration differences. Workaround: Create a snapshot, then create a new VM from that snapshot with the target size.",
    },
  },

  // ============================================
  // INFRA RULES - VM Resize
  // ============================================
  {
    id: "resize-same-family",
    name: "Same Family Resize",
    description: "Resizing within the same VM family",
    category: "infra",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.family", operator: "eq", value: "targetSku.family" },
    ],
    impact: {
      reboot: "likely",
      downtime: "low",
      reason:
        "Same-family resize typically requires a reboot but stays on the same hardware cluster.",
    },
    mitigations: ["stop-applications", "drain-connections"],
  },
  {
    id: "resize-cross-family",
    name: "Cross Family Resize",
    description: "Resizing to a different VM family",
    category: "infra",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.family", operator: "ne", value: "targetSku.family" },
    ],
    impact: {
      reboot: "guaranteed",
      downtime: "medium",
      reason:
        "Cross-family resize requires VM reallocation to different hardware. The VM will be stopped and restarted.",
    },
    mitigations: [
      "backup-vm",
      "stop-vm-gracefully",
      "stop-applications",
      "drain-connections",
    ],
  },
  {
    id: "resize-requires-deallocation",
    name: "Resize Requires Deallocation",
    description: "Target SKU not available on current cluster",
    category: "infra",
    actions: ["ResizeVM"],
    conditions: [
      { field: "targetSku.requiresDeallocation", operator: "eq", value: true },
    ],
    impact: {
      reboot: "guaranteed",
      downtime: "high",
      reason:
        "Target SKU requires full deallocation. The VM will get a new hardware allocation and potentially a new IP address if not using static IP.",
    },
    mitigations: [
      "backup-vm",
      "snapshot-os-disk",
      "stop-vm-gracefully",
      "deallocate-vm",
    ],
  },
  {
    id: "resize-processor-change",
    name: "Processor Architecture Change",
    description: "Resizing between different processor architectures",
    category: "infra",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.processor", operator: "ne", value: "targetSku.processor" },
    ],
    impact: {
      reboot: "guaranteed",
      downtime: "medium",
      reason:
        "Changing processor architecture requires VM reallocation to different hardware. The VM will be moved to a host with the new processor type. This is generally safe but verify application compatibility.",
    },
    mitigations: [
      "backup-vm",
      "stop-vm-gracefully",
      "stop-applications",
      "drain-connections",
    ],
  },
  {
    id: "blocker-x86-to-arm",
    name: "x86 to ARM Architecture Blocked",
    description: "Cannot resize from x86/x64 to ARM architecture",
    category: "blocker",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.processor", operator: "ne", value: "ARM" },
      { field: "targetSku.processor", operator: "eq", value: "ARM" },
    ],
    impact: {
      reason:
        "Cannot resize from x86/x64 to ARM architecture. ARM VMs require ARM-compatible OS images - the existing OS disk will not boot on ARM hardware. Workaround: Deploy a new ARM-based VM with an ARM-compatible image and migrate your data.",
    },
  },
  {
    id: "blocker-arm-to-x86",
    name: "ARM to x86 Architecture Blocked",
    description: "Cannot resize from ARM to x86/x64 architecture",
    category: "blocker",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.processor", operator: "eq", value: "ARM" },
      { field: "targetSku.processor", operator: "ne", value: "ARM" },
    ],
    impact: {
      reason:
        "Cannot resize from ARM to x86/x64 architecture. x86 VMs require x86-compatible OS images - the existing ARM OS disk will not boot on x86 hardware. Workaround: Deploy a new x86-based VM with an x86-compatible image and migrate your data.",
    },
  },

  // ============================================
  // INFRA RULES - Redeploy
  // ============================================
  {
    id: "redeploy-temp-disk-loss",
    name: "Temp Disk Data Loss on Redeploy",
    description: "Redeploy will lose all temp disk data",
    category: "infra",
    actions: ["RedeployVM"],
    conditions: [{ field: "vm.hasTempDisk", operator: "eq", value: true }],
    impact: {
      reboot: "guaranteed",
      downtime: "medium",
      reason:
        "Redeploy moves the VM to new hardware. All data on the temporary disk will be permanently lost.",
    },
    mitigations: ["backup-temp-disk-data", "backup-vm"],
  },
  {
    id: "redeploy-standard",
    name: "Standard Redeploy",
    description: "Standard redeploy operation",
    category: "infra",
    actions: ["RedeployVM"],
    conditions: [],
    impact: {
      reboot: "guaranteed",
      downtime: "medium",
      reason:
        "Redeploy moves the VM to a new Azure host. Expect 5-15 minutes of downtime.",
    },
    mitigations: ["stop-applications", "drain-connections", "notify-users"],
  },

  // ============================================
  // INFRA RULES - Disk Resize
  // ============================================
  {
    id: "os-disk-resize-reboot",
    name: "OS Disk Resize Requires Reboot",
    description: "OS disk resize requires VM restart",
    category: "infra",
    actions: ["ResizeOSDisk"],
    conditions: [],
    impact: {
      reboot: "guaranteed",
      downtime: "low",
      reason:
        "OS disk resize requires the VM to be stopped and deallocated. The VM will restart after the resize.",
    },
    mitigations: [
      "snapshot-os-disk",
      "stop-vm-gracefully",
      "deallocate-vm",
      "stop-applications",
    ],
  },
  {
    id: "data-disk-online-resize",
    name: "Data Disk Online Resize",
    description: "Data disk can be resized without VM restart",
    category: "infra",
    actions: ["ResizeDataDisk"],
    conditions: [{ field: "disk.type", operator: "ne", value: "UltraSSD_LRS" }],
    impact: {
      reboot: "none",
      downtime: "none",
      reason:
        "Data disk resize can be performed online without stopping the VM. Guest OS action required to extend filesystem.",
    },
    mitigations: ["snapshot-data-disks"],
  },
  {
    id: "ultra-ssd-online-resize",
    name: "Ultra SSD Online Resize",
    description: "Ultra SSD can be resized online with specific conditions",
    category: "infra",
    actions: ["ResizeDataDisk"],
    conditions: [{ field: "disk.type", operator: "eq", value: "UltraSSD_LRS" }],
    impact: {
      reboot: "none",
      downtime: "none",
      reason:
        "Ultra SSD disk resize can be performed online. You can also adjust IOPS and throughput without detaching the disk. Guest OS action required to extend filesystem.",
    },
    mitigations: ["snapshot-data-disks"],
  },

  // ============================================
  // INFRA RULES - Disk Detach
  // ============================================
  {
    id: "detach-disk-online-linux",
    name: "Online Disk Detach (Linux)",
    description: "Disk detach while Linux VM is running",
    category: "infra",
    actions: ["DetachDisk"],
    conditions: [
      { field: "vm.running", operator: "eq", value: true },
      { field: "os.family", operator: "eq", value: "Linux" },
    ],
    impact: {
      reboot: "none",
      downtime: "none",
      reason:
        "Data disk can be detached while VM is running, but the filesystem must be unmounted first.",
    },
    mitigations: ["unmount-filesystem", "remove-fstab-entry"],
  },
  {
    id: "detach-disk-online-windows",
    name: "Online Disk Detach (Windows)",
    description: "Disk detach while Windows VM is running",
    category: "infra",
    actions: ["DetachDisk"],
    conditions: [
      { field: "vm.running", operator: "eq", value: true },
      { field: "os.family", operator: "eq", value: "Windows" },
    ],
    impact: {
      reboot: "none",
      downtime: "none",
      reason:
        "Data disk can be detached while VM is running, but the disk must be set offline in Disk Management first.",
    },
    mitigations: ["offline-disk-windows"],
  },
  {
    id: "detach-disk-offline",
    name: "Offline Disk Detach",
    description: "Disk detach while VM is stopped/deallocated",
    category: "infra",
    actions: ["DetachDisk"],
    conditions: [
      { field: "vm.running", operator: "eq", value: false },
    ],
    impact: {
      reboot: "none",
      downtime: "none",
      reason:
        "Disk can be safely detached while VM is stopped. No guest OS actions required. Remember to update fstab (Linux) or verify disk configuration (Windows) before starting the VM.",
    },
    mitigations: [],
  },

  // ============================================
  // GUEST RULES - LVM
  // ============================================
  {
    id: "lvm-pv-detach-critical",
    name: "LVM Physical Volume Detach",
    description: "Detaching a disk that is an LVM physical volume",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "lvm" }],
    impact: {
      risk: "critical",
      reason:
        "This disk is part of an LVM volume group. Detaching it will cause data loss and potentially make the VG unusable.",
      affectedComponents: ["Volume Group", "Logical Volumes", "Mounted Filesystems"],
    },
    mitigations: [
      "stop-applications",
      "unmount-filesystem",
      "deactivate-vg",
      "remove-pv-from-vg",
    ],
  },
  {
    id: "lvm-disk-resize",
    name: "LVM Disk Resize",
    description: "Resizing a disk that is an LVM physical volume",
    category: "guest",
    actions: ["ResizeDataDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "lvm" }],
    impact: {
      risk: "low",
      reason:
        "Disk resize is safe but requires pvresize to recognize the new space, followed by lvextend and filesystem resize.",
      affectedComponents: ["Physical Volume", "Volume Group capacity"],
    },
    mitigations: ["snapshot-data-disks", "extend-lv-after-resize"],
  },

  // ============================================
  // GUEST RULES - RAID
  // ============================================
  {
    id: "raid-disk-resize",
    name: "RAID Array Disk Resize",
    description: "Resizing a disk that is part of a RAID array",
    category: "guest",
    actions: ["ResizeDataDisk"],
    conditions: [
      { field: "disk.topology", operator: "in", value: ["raid0", "raid1", "raid5"] },
    ],
    impact: {
      risk: "medium",
      reason:
        "Disk resize is possible but RAID arrays require all member disks to be the same size. You must resize ALL disks in the array, then use mdadm --grow to expand the array, followed by filesystem resize.",
      affectedComponents: ["RAID Array", "Filesystem"],
    },
    mitigations: ["snapshot-data-disks", "check-raid-health"],
  },
  {
    id: "raid0-disk-detach-critical",
    name: "RAID0 Disk Detach",
    description: "Detaching a disk from a RAID0 array",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "raid0" }],
    impact: {
      risk: "critical",
      reason:
        "RAID0 has no redundancy. Removing any disk will destroy the entire array and cause complete data loss.",
      affectedComponents: ["RAID Array", "All data on array"],
    },
    mitigations: ["backup-vm", "snapshot-data-disks", "stop-applications"],
  },
  {
    id: "raid1-disk-detach-high",
    name: "RAID1 Disk Detach",
    description: "Detaching a disk from a RAID1 array",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "raid1" }],
    impact: {
      risk: "high",
      reason:
        "RAID1 will continue operating in degraded mode but with no redundancy. A second disk failure will cause data loss.",
      affectedComponents: ["RAID Array redundancy"],
    },
    mitigations: [
      "check-raid-health",
      "fail-disk-from-raid",
      "stop-applications",
    ],
  },
  {
    id: "raid5-disk-detach-high",
    name: "RAID5 Disk Detach",
    description: "Detaching a disk from a RAID5 array",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "raid5" }],
    impact: {
      risk: "high",
      reason:
        "RAID5 will continue operating in degraded mode. Performance will decrease and another disk failure will cause data loss.",
      affectedComponents: ["RAID Array redundancy", "I/O performance"],
    },
    mitigations: [
      "check-raid-health",
      "fail-disk-from-raid",
      "stop-applications",
    ],
  },

  // ============================================
  // GUEST RULES - Windows Storage Spaces
  // ============================================
  {
    id: "storage-spaces-disk-detach-critical",
    name: "Storage Spaces Disk Detach",
    description: "Detaching a disk from a Storage Spaces pool",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "storage-spaces" }],
    impact: {
      risk: "critical",
      reason:
        "This disk is part of a Storage Spaces pool. Detaching it may cause data loss depending on the pool's resiliency settings. Simple spaces have no redundancy.",
      affectedComponents: ["Storage Pool", "Virtual Disks", "Volumes"],
    },
    mitigations: [
      "stop-applications",
      "offline-disk-windows",
    ],
  },
  {
    id: "striped-disk-detach-critical",
    name: "Striped Volume Disk Detach",
    description: "Detaching a disk from a striped volume",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "striped" }],
    impact: {
      risk: "critical",
      reason:
        "Striped volumes (RAID0 equivalent) have no redundancy. Removing any disk will destroy the entire volume and cause complete data loss.",
      affectedComponents: ["Striped Volume", "All data on volume"],
    },
    mitigations: ["backup-vm", "snapshot-data-disks", "stop-applications"],
  },
  {
    id: "mirrored-disk-detach-high",
    name: "Mirrored Volume Disk Detach",
    description: "Detaching a disk from a mirrored volume",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "mirrored" }],
    impact: {
      risk: "high",
      reason:
        "Mirrored volumes (RAID1 equivalent) will continue operating but with no redundancy. A second disk failure will cause data loss.",
      affectedComponents: ["Mirror redundancy"],
    },
    mitigations: [
      "stop-applications",
      "offline-disk-windows",
    ],
  },
  {
    id: "storage-spaces-disk-resize",
    name: "Storage Spaces Disk Resize",
    description: "Resizing a disk in a Storage Spaces pool",
    category: "guest",
    actions: ["ResizeDataDisk"],
    conditions: [{ field: "disk.topology", operator: "eq", value: "storage-spaces" }],
    impact: {
      risk: "low",
      reason:
        "Disk resize is safe. After resize, use Server Manager or PowerShell to extend the virtual disk and volume to use the additional space.",
      affectedComponents: ["Storage Pool capacity"],
    },
    mitigations: ["snapshot-data-disks"],
  },

  // ============================================
  // GUEST RULES - Filesystem
  // ============================================
  {
    id: "mounted-disk-detach-linux",
    name: "Mounted Disk Detach (Linux)",
    description: "Detaching a disk with mounted filesystem on Linux",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [
      { field: "disk.mount", operator: "exists", value: true },
      { field: "os.family", operator: "eq", value: "Linux" },
    ],
    impact: {
      risk: "high",
      reason:
        "Disk has an active mount point. Detaching without unmounting will cause filesystem corruption and potential data loss.",
      affectedComponents: ["Filesystem", "Applications using mount point"],
    },
    mitigations: [
      "stop-applications",
      "unmount-filesystem",
      "remove-fstab-entry",
    ],
  },
  {
    id: "mounted-disk-detach-windows",
    name: "Mounted Disk Detach (Windows)",
    description: "Detaching a disk with active volume on Windows",
    category: "guest",
    actions: ["DetachDisk"],
    conditions: [
      { field: "disk.mount", operator: "exists", value: true },
      { field: "os.family", operator: "eq", value: "Windows" },
    ],
    impact: {
      risk: "high",
      reason:
        "Disk has an active volume. Detaching without setting it offline will cause data loss and potential corruption.",
      affectedComponents: ["Volume", "Applications using drive letter"],
    },
    mitigations: [
      "stop-applications",
      "offline-disk-windows",
    ],
  },
  {
    id: "os-disk-resize-filesystem",
    name: "OS Disk Filesystem Extension",
    description: "OS disk resize requires filesystem extension",
    category: "guest",
    actions: ["ResizeOSDisk"],
    conditions: [{ field: "os.family", operator: "eq", value: "Linux" }],
    impact: {
      risk: "low",
      reason:
        "After OS disk resize, the partition and filesystem must be extended. Most modern Linux images handle this automatically on boot.",
      affectedComponents: ["Root filesystem"],
    },
    mitigations: ["extend-filesystem", "verify-mounts"],
  },
  {
    id: "os-disk-resize-windows",
    name: "Windows OS Disk Extension",
    description: "Windows OS disk resize requires partition extension",
    category: "guest",
    actions: ["ResizeOSDisk"],
    conditions: [{ field: "os.family", operator: "eq", value: "Windows" }],
    impact: {
      risk: "low",
      reason:
        "After OS disk resize, use Disk Management to extend the C: volume into the new unallocated space.",
      affectedComponents: ["C: drive"],
    },
    mitigations: ["extend-partition-windows", "verify-disks-attached"],
  },

  // ============================================
  // GUEST RULES - Temp Disk
  // ============================================
  {
    id: "resize-temp-disk-change-windows",
    name: "Temp Disk Size Change (Windows)",
    description: "Target SKU has different temp disk size on Windows",
    category: "guest",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.hasTempDisk", operator: "eq", value: true },
      { field: "targetSku.tempDiskGB", operator: "gt", value: 0 },
      { field: "vm.tempDiskSize", operator: "ne", value: "targetSku.tempDiskGB" },
      { field: "os.family", operator: "eq", value: "Windows" },
    ],
    impact: {
      risk: "medium",
      reason:
        "Target SKU has a different temp disk size. All temp disk data will be lost during resize. Ensure page file is configured correctly.",
      affectedComponents: ["Temp disk (D:)", "Page file"],
    },
    mitigations: ["backup-temp-disk-data", "move-pagefile"],
  },
  {
    id: "resize-temp-disk-change-linux",
    name: "Temp Disk Size Change (Linux)",
    description: "Target SKU has different temp disk size on Linux",
    category: "guest",
    actions: ["ResizeVM"],
    conditions: [
      { field: "vm.hasTempDisk", operator: "eq", value: true },
      { field: "targetSku.tempDiskGB", operator: "gt", value: 0 },
      { field: "vm.tempDiskSize", operator: "ne", value: "targetSku.tempDiskGB" },
      { field: "os.family", operator: "eq", value: "Linux" },
    ],
    impact: {
      risk: "medium",
      reason:
        "Target SKU has a different temp disk size. All temp disk data will be lost during resize. Review swap configuration if using temp disk for swap.",
      affectedComponents: ["Temp disk (/dev/sdb)", "Swap partition"],
    },
    mitigations: ["backup-temp-disk-data"],
  },

  // ============================================
  // ENCRYPTION RULES - ENABLE
  // ============================================
  {
    id: "enable-ade-linux",
    name: "Enable Azure Disk Encryption (Linux)",
    description: "Enable ADE on Linux VM",
    category: "infra",
    actions: ["EnableEncryption"],
    conditions: [
      { field: "os.family", operator: "eq", value: "Linux" },
      { field: "action.encryptionOperation", operator: "eq", value: "enable" },
    ],
    impact: {
      reboot: "guaranteed",
      downtime: "medium",
      reason:
        "Enabling Azure Disk Encryption requires the VM to be restarted. The encryption process runs in the background and may take 1-2 hours depending on disk size.",
    },
    mitigations: ["backup-vm", "snapshot-os-disk", "stop-applications"],
  },
  {
    id: "enable-ade-windows",
    name: "Enable Azure Disk Encryption (Windows)",
    description: "Enable ADE on Windows VM",
    category: "infra",
    actions: ["EnableEncryption"],
    conditions: [
      { field: "os.family", operator: "eq", value: "Windows" },
      { field: "action.encryptionOperation", operator: "eq", value: "enable" },
    ],
    impact: {
      reboot: "guaranteed",
      downtime: "medium",
      reason:
        "Enabling Azure Disk Encryption requires the VM to be restarted. BitLocker will encrypt the drives. This process may take 1-2 hours depending on disk size.",
    },
    mitigations: ["backup-vm", "snapshot-os-disk", "stop-applications"],
  },
  {
    id: "enable-encryption-data-disks",
    name: "Enable Data Disk Encryption",
    description: "Encrypting data disks",
    category: "guest",
    actions: ["EnableEncryption"],
    conditions: [
      { field: "disks.count", operator: "gt", value: 0 },
      { field: "action.encryptionOperation", operator: "eq", value: "enable" },
    ],
    impact: {
      risk: "low",
      reason:
        "Data disks will also be encrypted. Ensure all mounted filesystems are properly configured and no I/O is in progress during encryption.",
      affectedComponents: ["All data disks", "Mounted filesystems"],
    },
    mitigations: ["snapshot-data-disks", "stop-applications"],
  },

  // ============================================
  // ENCRYPTION RULES - DISABLE
  // ============================================
  {
    id: "disable-ade-linux",
    name: "Disable Azure Disk Encryption (Linux)",
    description: "Disable ADE on Linux VM",
    category: "infra",
    actions: ["EnableEncryption"],
    conditions: [
      { field: "os.family", operator: "eq", value: "Linux" },
      { field: "action.encryptionOperation", operator: "eq", value: "disable" },
    ],
    impact: {
      reboot: "possible",
      downtime: "low",
      reason:
        "Disabling Azure Disk Encryption on Linux data disks can be done online. However, disabling encryption on the OS disk requires a reboot. Decryption runs in the background.",
    },
    mitigations: ["backup-vm", "stop-applications"],
  },
  {
    id: "disable-ade-windows",
    name: "Disable Azure Disk Encryption (Windows)",
    description: "Disable ADE on Windows VM",
    category: "infra",
    actions: ["EnableEncryption"],
    conditions: [
      { field: "os.family", operator: "eq", value: "Windows" },
      { field: "action.encryptionOperation", operator: "eq", value: "disable" },
    ],
    impact: {
      reboot: "possible",
      downtime: "low",
      reason:
        "Disabling Azure Disk Encryption removes BitLocker protection. Data disk decryption can be done online, but OS disk may require a reboot. Decryption runs in the background.",
    },
    mitigations: ["backup-vm", "stop-applications"],
  },
  {
    id: "disable-encryption-data-disks",
    name: "Disable Data Disk Encryption",
    description: "Removing encryption from data disks",
    category: "guest",
    actions: ["EnableEncryption"],
    conditions: [
      { field: "disks.count", operator: "gt", value: 0 },
      { field: "action.encryptionOperation", operator: "eq", value: "disable" },
    ],
    impact: {
      risk: "low",
      reason:
        "Data disks will be decrypted. The decryption process runs in the background and may take 1-2 hours depending on disk size. Data remains accessible during decryption.",
      affectedComponents: ["All data disks"],
    },
    mitigations: ["backup-vm"],
  },

  // ============================================
  // AVAILABILITY ZONE RULES
  // ============================================
  {
    id: "zone-to-zone-migration",
    name: "Zone-to-Zone Migration",
    description: "Moving VM from one zone to another zone",
    category: "infra",
    actions: ["ChangeZone"],
    conditions: [{ field: "vm.zonal", operator: "eq", value: true }],
    impact: {
      reboot: "guaranteed",
      downtime: "high",
      reason:
        "Moving a VM between Availability Zones (e.g., Zone 1 to Zone 2) is a manual process. You must: 1) Create snapshots of all disks, 2) Delete the VM (keeping disks), 3) Recreate the VM in the target zone using the snapshots. There is no direct migration path or portal option for zone-to-zone moves. Expect significant downtime.",
    },
    mitigations: ["backup-vm", "snapshot-os-disk", "snapshot-data-disks", "notify-users"],
  },
  {
    id: "regional-to-zonal-migration",
    name: "Regional to Zonal Migration",
    description: "Adding availability zone to non-zonal VM",
    category: "infra",
    actions: ["ChangeZone"],
    conditions: [{ field: "vm.zonal", operator: "eq", value: false }],
    impact: {
      reboot: "guaranteed",
      downtime: "medium",
      reason:
        "Converting a regional (non-zonal) VM to a zonal deployment is fully supported. Simplest method: Use the Azure portal's 'Edit Availability' feature to select the target zone - Azure creates a snapshot, deploys a new zonal VM, and stops the original. Alternative: Use Azure Site Recovery for minimal downtime. Note: A new NIC and potentially new Public IP will be created.",
    },
    mitigations: ["backup-vm", "use-portal-zone-move", "use-site-recovery", "notify-users"],
  },
  {
    id: "regional-to-zonal-resources",
    name: "Resource Changes on Zone Move",
    description: "New resources created during regional to zonal migration",
    category: "guest",
    actions: ["ChangeZone"],
    conditions: [{ field: "vm.zonal", operator: "eq", value: false }],
    impact: {
      risk: "medium",
      reason:
        "When moving from regional to zonal deployment, a new Network Interface Card (NIC) and potentially a new Public IP address are created. Update any scripts, firewall rules, or DNS records that reference the old resources. The original VM must be deleted after migration to avoid double billing.",
      affectedComponents: ["Network Interface", "Public IP", "DNS records"],
    },
    mitigations: ["notify-users"],
  },

  // ============================================
  // CROSS-REGION MOVE RULES
  // ============================================
  {
    id: "cross-region-move",
    name: "Cross-Region VM Migration",
    description: "Moving VM to a different Azure region",
    category: "infra",
    actions: ["CrossRegionMove"],
    conditions: [],
    impact: {
      reboot: "guaranteed",
      downtime: "high",
      reason:
        "Cross-region move requires creating disk snapshots, copying them to the target region, and recreating the VM. Recommended: Use Azure Resource Mover for centralized management, dependency identification, and cleanup. Alternative: Use Azure Site Recovery for replication-based migration with minimal cutover downtime. Expect 30+ minutes depending on disk sizes and region distance.",
    },
    mitigations: ["backup-vm", "snapshot-os-disk", "snapshot-data-disks", "use-resource-mover", "use-site-recovery", "notify-users"],
  },
  {
    id: "cross-region-ip-change",
    name: "IP Address Change on Region Move",
    description: "Public IP will change on region move",
    category: "guest",
    actions: ["CrossRegionMove"],
    conditions: [],
    impact: {
      risk: "high",
      reason:
        "Public and private IP addresses will change after moving to a new region. Update DNS records, firewall rules, and application configurations accordingly.",
      affectedComponents: ["Public IP", "Private IP", "DNS records", "Firewall rules"],
    },
    mitigations: ["notify-users"],
  },
  {
    id: "cross-region-networking",
    name: "Network Configuration Changes",
    description: "Network settings need reconfiguration",
    category: "guest",
    actions: ["CrossRegionMove"],
    conditions: [],
    impact: {
      risk: "medium",
      reason:
        "The VM will need to be connected to a VNet in the target region. NSGs, load balancers, and other networking components must be recreated or migrated separately.",
      affectedComponents: ["Virtual Network", "Subnet", "NSG", "Load Balancer"],
    },
    mitigations: [],
  },
];

export function getRulesByAction(action: string): Rule[] {
  return rules.filter((r) => r.actions.includes(action as Rule["actions"][number]));
}

export function getRulesByCategory(category: Rule["category"]): Rule[] {
  return rules.filter((r) => r.category === category);
}
