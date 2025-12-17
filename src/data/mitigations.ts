import { Mitigation } from "@/types";

export const mitigations: Record<string, Mitigation> = {
  // Pre-change mitigations
  "backup-vm": {
    id: "backup-vm",
    title: "Create VM Backup",
    description:
      "Create a full VM backup using Azure Backup before proceeding with the change.",
    required: true,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-first-look-arm",
  },
  "snapshot-os-disk": {
    id: "snapshot-os-disk",
    title: "Snapshot OS Disk",
    description:
      "Create a snapshot of the OS disk to enable quick rollback if the change fails.",
    required: true,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/snapshot-copy-managed-disk",
  },
  "snapshot-data-disks": {
    id: "snapshot-data-disks",
    title: "Snapshot Data Disks",
    description:
      "Create snapshots of all data disks involved in the change operation.",
    required: true,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/snapshot-copy-managed-disk",
  },
  "stop-vm-gracefully": {
    id: "stop-vm-gracefully",
    title: "Stop VM Gracefully",
    description:
      "Shut down the VM gracefully from within the OS before deallocating to ensure filesystem consistency.",
    required: true,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/states-billing",
  },
  "deallocate-vm": {
    id: "deallocate-vm",
    title: "Deallocate VM",
    description:
      "Deallocate (stop) the VM to release hardware resources. Required for certain resize operations.",
    required: true,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/resize-vm",
  },

  // Application-level mitigations
  "stop-applications": {
    id: "stop-applications",
    title: "Stop Applications",
    description:
      "Stop all applications and services that depend on the affected disks to prevent data corruption.",
    required: true,
  },
  "drain-connections": {
    id: "drain-connections",
    title: "Drain Active Connections",
    description:
      "Drain active connections from load balancers and allow existing sessions to complete.",
    required: false,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-overview",
  },
  "notify-users": {
    id: "notify-users",
    title: "Notify Users",
    description:
      "Send maintenance notification to affected users before proceeding.",
    required: false,
  },

  // LVM-specific mitigations
  "deactivate-vg": {
    id: "deactivate-vg",
    title: "Deactivate Volume Group",
    description:
      "Run 'vgchange -an <vg_name>' to deactivate the volume group before disk operations.",
    required: true,
    docUrl: "https://man7.org/linux/man-pages/man8/vgchange.8.html",
  },
  "remove-pv-from-vg": {
    id: "remove-pv-from-vg",
    title: "Remove PV from Volume Group",
    description:
      "Use 'pvmove' to migrate data off the disk, then 'vgreduce' to remove it from the VG.",
    required: true,
    docUrl: "https://man7.org/linux/man-pages/man8/pvmove.8.html",
  },
  "extend-lv-after-resize": {
    id: "extend-lv-after-resize",
    title: "Extend LV After Disk Resize",
    description:
      "After resizing the disk, run 'pvresize', 'lvextend', and 'resize2fs' to use the new space.",
    required: false,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/expand-disks",
  },

  // RAID-specific mitigations
  "check-raid-health": {
    id: "check-raid-health",
    title: "Check RAID Array Health",
    description:
      "Verify RAID array is healthy using 'mdadm --detail' before any disk operations.",
    required: true,
  },
  "fail-disk-from-raid": {
    id: "fail-disk-from-raid",
    title: "Fail Disk from RAID Array",
    description:
      "Mark the disk as failed in the RAID array using 'mdadm --fail' before detaching.",
    required: true,
    docUrl: "https://docs.kernel.org/admin-guide/md.html",
  },

  // Filesystem mitigations
  "unmount-filesystem": {
    id: "unmount-filesystem",
    title: "Unmount Filesystem",
    description:
      "Unmount the filesystem before detaching the disk to prevent data corruption.",
    required: true,
  },
  "remove-fstab-entry": {
    id: "remove-fstab-entry",
    title: "Update /etc/fstab",
    description:
      "Remove or comment out the fstab entry for the disk to prevent boot failures.",
    required: true,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/attach-disk-portal#connect-to-the-linux-vm-to-mount-the-new-disk",
  },
  "extend-filesystem": {
    id: "extend-filesystem",
    title: "Extend Filesystem",
    description:
      "After disk resize, extend the filesystem using 'resize2fs' (ext4) or 'xfs_growfs' (XFS).",
    required: false,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/expand-disks",
  },

  // Windows-specific mitigations
  "extend-partition-windows": {
    id: "extend-partition-windows",
    title: "Extend Partition in Windows",
    description:
      "Use Disk Management or 'Extend-Partition' PowerShell cmdlet to extend the volume.",
    required: false,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/windows/expand-os-disk",
  },
  "offline-disk-windows": {
    id: "offline-disk-windows",
    title: "Offline Disk in Windows",
    description:
      "Set the disk offline in Disk Management before detaching to ensure clean removal.",
    required: true,
  },

  // Temp disk mitigations
  "backup-temp-disk-data": {
    id: "backup-temp-disk-data",
    title: "Backup Temp Disk Data",
    description:
      "Copy any important data from the temp disk (D: or /dev/sdb) as it will be lost on redeploy.",
    required: true,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/managed-disks-overview#temporary-disk",
  },
  "move-pagefile": {
    id: "move-pagefile",
    title: "Move Page File",
    description:
      "Move the Windows page file from the temp disk if using a VM SKU without temp storage.",
    required: true,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/azure-vms-no-temp-disk",
  },

  // Zone and region migration mitigations
  "use-site-recovery": {
    id: "use-site-recovery",
    title: "Use Azure Site Recovery",
    description:
      "Azure Site Recovery enables replication to target zone/region with minimal downtime during failover. Recommended for production workloads.",
    required: false,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/site-recovery/move-azure-vms-avset-azone",
  },
  "use-resource-mover": {
    id: "use-resource-mover",
    title: "Use Azure Resource Mover",
    description:
      "Azure Resource Mover provides centralized management for cross-region moves, including dependency identification and cleanup.",
    required: false,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/resource-mover/overview",
  },
  "use-portal-zone-move": {
    id: "use-portal-zone-move",
    title: "Use Azure Portal Zone Move",
    description:
      "Use the Azure portal's built-in 'Edit Availability' feature to move regional VMs to a specific zone. Azure creates a snapshot, deploys a new zonal VM, and stops the original.",
    required: false,
    docUrl:
      "https://learn.microsoft.com/en-us/azure/virtual-machines/move-virtual-machines-regional-zonal-portal",
  },

  // Post-change verification
  "verify-disks-attached": {
    id: "verify-disks-attached",
    title: "Verify Disks Attached",
    description:
      "After restart, verify all disks are attached and accessible using 'lsblk' or Disk Management.",
    required: false,
  },
  "verify-mounts": {
    id: "verify-mounts",
    title: "Verify Mount Points",
    description:
      "Confirm all filesystems are mounted correctly at their expected mount points.",
    required: false,
  },
  "verify-applications": {
    id: "verify-applications",
    title: "Verify Applications",
    description:
      "Start applications and verify they function correctly with the new configuration.",
    required: false,
  },
};

export function getMitigation(id: string): Mitigation | undefined {
  return mitigations[id];
}

export function getMitigations(ids: string[]): Mitigation[] {
  return ids.map((id) => mitigations[id]).filter(Boolean);
}
