# Azure Change Impact Radar (AZpact)

Understand the **real impact of Azure VM changes** before execution.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## What it does

Evaluates the impact of VM changes including:

- **Infrastructure**: Reboots, downtime, deallocation
- **Guest OS**: Disk layout, LVM/RAID, mount points
- **Mitigations**: Required steps before changes

Supports: VM resize, disk resize, disk detach, redeploy, encryption, zone changes, and cross-region moves.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
```

Static output in `out/` - ready for Azure Static Web Apps.

## Extend

See [docs/](docs/) for detailed documentation on adding rules, mitigations, and SKUs.

## Disclaimer

Not affiliated with Microsoft. Verify with [official Azure documentation](https://learn.microsoft.com/en-us/azure/virtual-machines/) before production changes.

## Author

Created by [Ruben Santos](https://www.linkedin.com/in/rmssantos/)

## License

MIT
