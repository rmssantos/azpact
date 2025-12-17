import { OSImage } from "@/types";

export const osImages: OSImage[] = [
  // Ubuntu
  {
    id: "ubuntu-2404",
    family: "Linux",
    distro: "Ubuntu",
    version: "24.04",
    displayName: "Ubuntu 24.04 LTS",
  },
  {
    id: "ubuntu-2204",
    family: "Linux",
    distro: "Ubuntu",
    version: "22.04",
    displayName: "Ubuntu 22.04 LTS",
  },
  {
    id: "ubuntu-2004",
    family: "Linux",
    distro: "Ubuntu",
    version: "20.04",
    displayName: "Ubuntu 20.04 LTS",
  },
  // RHEL
  {
    id: "rhel-9",
    family: "Linux",
    distro: "RHEL",
    version: "9.0",
    displayName: "Red Hat Enterprise Linux 9",
  },
  {
    id: "rhel-8",
    family: "Linux",
    distro: "RHEL",
    version: "8.0",
    displayName: "Red Hat Enterprise Linux 8",
  },
  // CentOS / Rocky / Alma
  {
    id: "rocky-9",
    family: "Linux",
    distro: "Rocky",
    version: "9.0",
    displayName: "Rocky Linux 9",
  },
  {
    id: "alma-9",
    family: "Linux",
    distro: "AlmaLinux",
    version: "9.0",
    displayName: "AlmaLinux 9",
  },
  // Debian
  {
    id: "debian-12",
    family: "Linux",
    distro: "Debian",
    version: "12",
    displayName: "Debian 12 (Bookworm)",
  },
  {
    id: "debian-11",
    family: "Linux",
    distro: "Debian",
    version: "11",
    displayName: "Debian 11 (Bullseye)",
  },
  // SUSE
  {
    id: "sles-15",
    family: "Linux",
    distro: "SLES",
    version: "15",
    displayName: "SUSE Linux Enterprise Server 15",
  },
  // Windows Server
  {
    id: "windows-2022",
    family: "Windows",
    distro: "Windows Server",
    version: "2022",
    displayName: "Windows Server 2022",
  },
  {
    id: "windows-2019",
    family: "Windows",
    distro: "Windows Server",
    version: "2019",
    displayName: "Windows Server 2019",
  },
  {
    id: "windows-2016",
    family: "Windows",
    distro: "Windows Server",
    version: "2016",
    displayName: "Windows Server 2016",
  },
  // Windows Client (for dev/test)
  {
    id: "windows-11",
    family: "Windows",
    distro: "Windows",
    version: "11",
    displayName: "Windows 11 Pro",
  },
  {
    id: "windows-10",
    family: "Windows",
    distro: "Windows",
    version: "10",
    displayName: "Windows 10 Pro",
  },
];

export function getOSImage(id: string): OSImage | undefined {
  return osImages.find((img) => img.id === id);
}

export function getImagesByFamily(family: "Linux" | "Windows"): OSImage[] {
  return osImages.filter((img) => img.family === family);
}
