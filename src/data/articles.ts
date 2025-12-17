import { ActionType } from "@/types";

export interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "action" | "backup" | "troubleshoot" | "best-practice";
}

export const articles: Record<ActionType | "general", Article[]> = {
  // Resize VM articles
  ResizeVM: [
    {
      id: "resize-vm-overview",
      title: "Resize a Virtual Machine",
      description: "Official guide on how to resize Azure VMs, including limitations and best practices.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/resize-vm",
      category: "action",
    },
    {
      id: "vm-sizes-overview",
      title: "Azure VM Sizes Overview",
      description: "Understand the different VM sizes available in Azure and their specifications.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/overview",
      category: "action",
    },
    {
      id: "vm-sizes-selector",
      title: "Virtual Machine Selector",
      description: "Interactive tool to help choose the right VM size for your workload.",
      url: "https://azure.microsoft.com/en-us/pricing/vm-selector/",
      category: "best-practice",
    },
    {
      id: "vm-states-billing",
      title: "VM States and Billing",
      description: "Understand VM power states, provisioning states, and when you're billed.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/states-billing",
      category: "action",
    },
    {
      id: "vm-no-temp-disk",
      title: "VMs Without Temp Disk",
      description: "FAQ about Azure VM sizes that don't include a local temporary disk.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/azure-vms-no-temp-disk",
      category: "troubleshoot",
    },
  ],

  // Resize OS Disk articles
  ResizeOSDisk: [
    {
      id: "expand-os-disk-linux",
      title: "Expand OS Disk (Linux)",
      description: "How to expand the OS disk of a Linux VM and extend the filesystem.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/expand-disks",
      category: "action",
    },
    {
      id: "expand-os-disk-windows",
      title: "Expand OS Disk (Windows)",
      description: "How to expand the OS disk of a Windows VM and extend the partition.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/expand-os-disk",
      category: "action",
    },
    {
      id: "managed-disks-overview",
      title: "Azure Managed Disks Overview",
      description: "Learn about Azure managed disk types, performance tiers, and features.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/managed-disks-overview",
      category: "best-practice",
    },
    {
      id: "disk-scalability-targets",
      title: "Disk Scalability Targets",
      description: "Performance and scalability limits for Azure managed disks.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disks-scalability-targets",
      category: "best-practice",
    },
  ],

  // Resize Data Disk articles
  ResizeDataDisk: [
    {
      id: "expand-data-disk-linux",
      title: "Expand Data Disks (Linux)",
      description: "Expand a data disk and extend the partition/filesystem on Linux.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/expand-disks",
      category: "action",
    },
    {
      id: "expand-data-disk-windows",
      title: "Expand Data Disks (Windows)",
      description: "Expand a data disk and extend the volume on Windows.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/expand-os-disk",
      category: "action",
    },
    {
      id: "disk-bursting",
      title: "Disk Bursting",
      description: "Understand on-demand and credit-based disk bursting for improved performance.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disk-bursting",
      category: "best-practice",
    },
    {
      id: "ultra-disks",
      title: "Ultra Disks",
      description: "Learn about Azure Ultra Disks for high-performance workloads.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disks-enable-ultra-ssd",
      category: "best-practice",
    },
    {
      id: "lvm-linux",
      title: "Configure LVM on Linux",
      description: "How to configure Logical Volume Manager on a Linux VM in Azure.",
      url: "https://learn.microsoft.com/en-us/previous-versions/azure/virtual-machines/linux/configure-lvm",
      category: "action",
    },
  ],

  // Detach Disk articles
  DetachDisk: [
    {
      id: "detach-disk-linux",
      title: "Detach Data Disk (Linux)",
      description: "How to safely detach a data disk from a Linux VM.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/detach-disk",
      category: "action",
    },
    {
      id: "detach-disk-windows",
      title: "Detach Data Disk (Windows)",
      description: "How to safely detach a data disk from a Windows VM.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/detach-disk",
      category: "action",
    },
    {
      id: "attach-disk-linux",
      title: "Attach Data Disk (Linux)",
      description: "How to attach and mount a data disk on a Linux VM.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/attach-disk-portal",
      category: "action",
    },
    {
      id: "attach-disk-windows",
      title: "Attach Data Disk (Windows)",
      description: "How to attach and initialize a data disk on a Windows VM.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/attach-managed-disk-portal",
      category: "action",
    },
    {
      id: "raid-software-linux",
      title: "Software RAID on Linux",
      description: "Configure software RAID on Linux VMs using mdadm.",
      url: "https://learn.microsoft.com/en-us/previous-versions/azure/virtual-machines/linux/configure-raid",
      category: "action",
    },
  ],

  // Redeploy VM articles
  RedeployVM: [
    {
      id: "redeploy-vm",
      title: "Redeploy Virtual Machine",
      description: "How to redeploy a VM to a new Azure host to resolve issues.",
      url: "https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/redeploy-to-new-node-windows",
      category: "action",
    },
    {
      id: "redeploy-vm-linux",
      title: "Redeploy Linux VM",
      description: "Troubleshoot Linux VM by redeploying to a new Azure node.",
      url: "https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/linux/redeploy-to-new-node-linux",
      category: "action",
    },
    {
      id: "troubleshoot-rdp",
      title: "Troubleshoot RDP Connections",
      description: "Troubleshoot Remote Desktop connection issues to Azure VMs.",
      url: "https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/troubleshoot-rdp-connection",
      category: "troubleshoot",
    },
    {
      id: "troubleshoot-ssh",
      title: "Troubleshoot SSH Connections",
      description: "Troubleshoot SSH connection issues to Linux VMs in Azure.",
      url: "https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/linux/troubleshoot-ssh-connection",
      category: "troubleshoot",
    },
    {
      id: "vm-boot-diagnostics",
      title: "Boot Diagnostics",
      description: "Use boot diagnostics to troubleshoot VM startup issues.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/boot-diagnostics",
      category: "troubleshoot",
    },
    {
      id: "serial-console",
      title: "Serial Console",
      description: "Access Azure VM serial console for troubleshooting.",
      url: "https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/serial-console-overview",
      category: "troubleshoot",
    },
  ],

  // Enable Encryption articles
  EnableEncryption: [
    {
      id: "ade-overview",
      title: "Azure Disk Encryption Overview",
      description: "Learn about Azure Disk Encryption for Windows and Linux VMs.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview",
      category: "action",
    },
    {
      id: "ade-linux",
      title: "Enable ADE for Linux",
      description: "Step-by-step guide to enable Azure Disk Encryption on Linux VMs.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/disk-encryption-linux",
      category: "action",
    },
    {
      id: "ade-windows",
      title: "Enable ADE for Windows",
      description: "Step-by-step guide to enable Azure Disk Encryption on Windows VMs.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/disk-encryption-windows",
      category: "action",
    },
    {
      id: "ade-prerequisites",
      title: "ADE Prerequisites",
      description: "Prerequisites and requirements for Azure Disk Encryption.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview#supported-vms-and-operating-systems",
      category: "best-practice",
    },
    {
      id: "ade-troubleshoot",
      title: "Troubleshoot ADE",
      description: "Troubleshoot Azure Disk Encryption issues.",
      url: "https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/welcome-virtual-machines-windows",
      category: "troubleshoot",
    },
    {
      id: "server-side-encryption",
      title: "Server-Side Encryption",
      description: "Learn about server-side encryption with customer-managed keys.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption",
      category: "best-practice",
    },
  ],

  // Change Availability Zone articles
  ChangeZone: [
    {
      id: "availability-zones",
      title: "Availability Zones Overview",
      description: "Learn about Azure Availability Zones and high availability.",
      url: "https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview",
      category: "action",
    },
    {
      id: "portal-zone-move",
      title: "Move VM to Zone (Portal)",
      description: "Use Azure portal to move regional VMs to a specific Availability Zone.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/move-virtual-machines-regional-zonal-portal",
      category: "action",
    },
    {
      id: "asr-zone-move",
      title: "Move VM to Zone (Site Recovery)",
      description: "Use Azure Site Recovery to move VMs to Availability Zones with minimal downtime.",
      url: "https://learn.microsoft.com/en-us/azure/site-recovery/move-azure-vms-avset-azone",
      category: "action",
    },
    {
      id: "move-vm-to-zone",
      title: "Move VM to Availability Zone",
      description: "How to move an existing VM to an Availability Zone using Resource Mover.",
      url: "https://learn.microsoft.com/en-us/azure/resource-mover/move-region-availability-zone",
      category: "action",
    },
    {
      id: "vm-availability-options",
      title: "VM Availability Options",
      description: "Compare availability sets, zones, and scale sets.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/availability",
      category: "best-practice",
    },
    {
      id: "zone-redundant-storage",
      title: "Zone-Redundant Storage",
      description: "Learn about ZRS for managed disks.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/disks-redundancy#zone-redundant-storage-for-managed-disks",
      category: "best-practice",
    },
  ],

  // Cross-Region Move articles
  CrossRegionMove: [
    {
      id: "azure-resource-mover",
      title: "Azure Resource Mover",
      description: "Move Azure resources between regions using Resource Mover.",
      url: "https://learn.microsoft.com/en-us/azure/resource-mover/overview",
      category: "action",
    },
    {
      id: "move-vm-region",
      title: "Move VMs to Another Region",
      description: "Step-by-step guide to move VMs between Azure regions.",
      url: "https://learn.microsoft.com/en-us/azure/resource-mover/tutorial-move-region-virtual-machines",
      category: "action",
    },
    {
      id: "asr-region-move",
      title: "Move VMs with Site Recovery",
      description: "Use Azure Site Recovery for cross-region VM migration.",
      url: "https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-migrate",
      category: "action",
    },
    {
      id: "cross-region-considerations",
      title: "Region Move Considerations",
      description: "What to consider when moving Azure resources between regions.",
      url: "https://learn.microsoft.com/en-us/azure/resource-mover/move-region-within-resource-group",
      category: "best-practice",
    },
    {
      id: "azure-regions",
      title: "Azure Regions",
      description: "Overview of Azure regions and geographies.",
      url: "https://azure.microsoft.com/en-us/explore/global-infrastructure/geographies/",
      category: "best-practice",
    },
  ],

  // Stop VM articles
  StopVM: [
    {
      id: "stop-start-vm",
      title: "Stop and Start VMs",
      description: "Learn about stopping and starting Azure VMs and the billing implications.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/states-billing",
      category: "action",
    },
  ],

  // Deallocate VM articles
  DeallocateVM: [
    {
      id: "deallocate-vm",
      title: "Deallocate VMs",
      description: "Understand deallocating VMs and when temp disk data is lost.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/states-billing",
      category: "action",
    },
    {
      id: "temp-disk-overview",
      title: "Temporary Disk",
      description: "Understand the temporary disk on Azure VMs and data persistence.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/managed-disks-overview#temporary-disk",
      category: "best-practice",
    },
  ],

  // Capture VM articles
  CaptureVM: [
    {
      id: "capture-vm-windows",
      title: "Capture Windows VM Image",
      description: "Create a managed image of a generalized Windows VM.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/capture-image-resource",
      category: "action",
    },
    {
      id: "capture-vm-linux",
      title: "Capture Linux VM Image",
      description: "Create a managed image of a generalized Linux VM.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/capture-image",
      category: "action",
    },
    {
      id: "sysprep-overview",
      title: "Sysprep Overview",
      description: "Understand Sysprep for Windows image generalization.",
      url: "https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/sysprep-process-overview",
      category: "action",
    },
    {
      id: "create-vm-specialized",
      title: "Create VM from Specialized Image",
      description: "Create a VM from a specialized image without generalization.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/create-vm-specialized",
      category: "action",
    },
  ],

  // Add NIC articles
  AddNIC: [
    {
      id: "add-remove-nic",
      title: "Add or Remove Network Interfaces",
      description: "How to add or remove NICs from Azure VMs.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-network-interface-vm",
      category: "action",
    },
    {
      id: "multiple-nics-linux",
      title: "Configure Multiple NICs (Linux)",
      description: "Configure multiple network interfaces on a Linux VM.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/multiple-nics",
      category: "action",
    },
    {
      id: "multiple-nics-windows",
      title: "Configure Multiple NICs (Windows)",
      description: "Configure multiple network interfaces on a Windows VM.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/multiple-nics",
      category: "action",
    },
  ],

  // Remove NIC articles
  RemoveNIC: [
    {
      id: "add-remove-nic-remove",
      title: "Add or Remove Network Interfaces",
      description: "How to add or remove NICs from Azure VMs.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-network-interface-vm",
      category: "action",
    },
    {
      id: "nic-overview",
      title: "Network Interface Overview",
      description: "Understand network interfaces in Azure Virtual Network.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-network-interface",
      category: "best-practice",
    },
  ],

  // General articles (backups, snapshots, etc.)
  general: [
    {
      id: "backup-vm",
      title: "Back Up Azure VMs",
      description: "How to back up Azure virtual machines using Azure Backup.",
      url: "https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-first-look-arm",
      category: "backup",
    },
    {
      id: "snapshot-disk",
      title: "Create Disk Snapshot",
      description: "Create a snapshot of a virtual hard disk for backup or troubleshooting.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/snapshot-copy-managed-disk",
      category: "backup",
    },
    {
      id: "restore-vm",
      title: "Restore VM from Backup",
      description: "How to restore Azure VMs from Recovery Services vault.",
      url: "https://learn.microsoft.com/en-us/azure/backup/backup-azure-arm-restore-vms",
      category: "backup",
    },
    {
      id: "create-vm-snapshot",
      title: "Create VM from Snapshot",
      description: "Create a new VM from a disk snapshot.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/scripts/create-vm-from-snapshot",
      category: "backup",
    },
    {
      id: "recovery-services-vault",
      title: "Recovery Services Vault",
      description: "Overview of Azure Recovery Services vault for backup management.",
      url: "https://learn.microsoft.com/en-us/azure/backup/backup-azure-recovery-services-vault-overview",
      category: "backup",
    },
    {
      id: "azure-site-recovery",
      title: "Azure Site Recovery",
      description: "Set up disaster recovery for Azure VMs.",
      url: "https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-enable-replication",
      category: "backup",
    },
    {
      id: "vm-availability",
      title: "VM Availability Options",
      description: "Understand availability sets, zones, and scale sets.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/availability",
      category: "best-practice",
    },
    {
      id: "vm-maintenance",
      title: "Maintenance and Updates",
      description: "Understand Azure maintenance events and how to prepare.",
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/maintenance-and-updates",
      category: "best-practice",
    },
  ],
};

export function getArticlesForAction(action: ActionType): Article[] {
  return articles[action] || [];
}

export function getGeneralArticles(): Article[] {
  return articles.general;
}

export function getAllArticlesForAction(action: ActionType): {
  actionArticles: Article[];
  generalArticles: Article[];
} {
  return {
    actionArticles: getArticlesForAction(action),
    generalArticles: getGeneralArticles(),
  };
}
