# Contributing to AZpact

Thanks for your interest in contributing to the Azure Change Impact Radar!

## Two Ways to Contribute

### Option A: Request a New Rule (No coding required)

If you found a missing Azure scenario but don't want to write YAML:

1. Go to [Issues](https://github.com/rmssantos/azpact/issues)
2. Click **New Issue**
3. Select **New Rule Request**
4. Fill in the template with the Azure scenario details
5. A maintainer will create the rule for you

### Option B: Submit a Rule Yourself (Fork + Pull Request)

If you want to contribute directly:

1. **Fork** the repository
2. **Create** your rule/mitigation in YAML
3. **Test** locally with `npm run validate-kb`
4. **Submit** a Pull Request
5. **Review** - maintainers review and merge

All PRs are automatically validated by GitHub Actions.

---

## Step-by-Step Guide: Fork & Pull Request

### Step 1: Fork the Repository

1. Go to [github.com/rmssantos/azpact](https://github.com/rmssantos/azpact)
2. Click the **Fork** button (top right)
3. This creates a copy in your GitHub account: `github.com/YOUR-USERNAME/azpact`

### Step 2: Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/azpact.git
cd azpact
npm install
```

### Step 3: Create a Branch

```bash
git checkout -b add-my-new-rule
```

### Step 4: Create Your Rule

Create a new YAML file or add to an existing one in `kb/rules/`:

```bash
# Example: adding a rule for VM resize
code kb/rules/resize-vm/my-new-rule.yaml
```

Write your rule (see Rule Structure section below).

### Step 5: Test Locally

```bash
# Build and validate
npm run build-kb
npm run validate-kb

# If validation passes, run full build
npm run build
```

Fix any errors before proceeding.

### Step 6: Commit and Push

```bash
git add .
git commit -m "Add rule for [describe scenario]"
git push origin add-my-new-rule
```

### Step 7: Open a Pull Request

1. Go to your fork on GitHub
2. Click **Compare & pull request**
3. Fill in the PR template
4. Click **Create pull request**

### Step 8: Wait for Review

- GitHub Actions will automatically validate your rule
- If validation fails, fix the errors and push again
- A maintainer will review and merge your PR

---

## Adding New Rules

Rules are defined in YAML files under `kb/rules/`. Each file can contain multiple rules.

### Rule Structure

```yaml
- id: my-rule-id                    # Required: kebab-case, unique
  name: My Rule Name                # Required: human-readable name
  description: What this rule does  # Required: brief description

  type: rule                        # rule | blocker | override
  layer: infra                      # infra | guest

  actions: [ResizeVM]               # Which actions trigger this rule

  conditions:                       # When the rule applies
    - field: os.family
      operator: eq
      value: Linux

  impact:                           # What happens
    reboot: guaranteed              # none | possible | likely | guaranteed
    downtime: medium                # none | low | medium | high
    reason: >
      Explanation of why this impact occurs.

  mitigations:                      # Steps to reduce risk
    - backup-vm
    - stop-applications

  sources:                          # Official documentation
    - title: "Azure Docs - Topic"
      url: "https://learn.microsoft.com/..."
```

### Rule Types

| Type | Purpose |
|------|---------|
| `rule` | Standard impact assessment |
| `blocker` | Operation cannot proceed |
| `override` | Modifies another rule's behavior |

### Layers

| Layer | Impact Fields |
|-------|---------------|
| `infra` | `reboot`, `downtime` |
| `guest` | `risk`, `affectedComponents` |

### Condition Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `value: "Linux"` |
| `ne` | Not equals | `value: "Windows"` |
| `in` | In array | `value: [raid0, raid1]` |
| `nin` | Not in array | `value: [lvm, raid]` |
| `gt`, `gte` | Greater than | `value: 0` |
| `lt`, `lte` | Less than | `value: 100` |
| `exists` | Field exists | `value: true` |
| `notExists` | Field missing | `value: true` |
| `matches` | Regex match | `value: "^Standard_D"` |

### Available Field Paths

**VM Properties (`vm.*`):**
- `vm.generation` - Gen1 | Gen2
- `vm.family` - SKU family (e.g., Dsv5)
- `vm.processor` - Intel | AMD | ARM
- `vm.hasTempDisk` - boolean
- `vm.tempDiskSize` - number (GB)
- `vm.running` - boolean
- `vm.zonal` - boolean

**OS Properties (`os.*`):**
- `os.family` - Windows | Linux
- `os.distro` - distribution name
- `os.version` - version string

**Target Disk (`disk.*`):**
- `disk.type` - Standard_LRS | StandardSSD_LRS | Premium_LRS | UltraSSD_LRS
- `disk.topology` - raw | lvm | raid | storage-spaces | striped | mirrored
- `disk.mount` - mount point

**Disk Aggregates (`disks.*`):**
- `disks.count` - number of data disks
- `disks.hasUltraSSD` - boolean

**Target SKU (`targetSku.*`):**
- `targetSku.family` - target family
- `targetSku.processor` - target processor
- `targetSku.generation` - Gen1 | Gen2
- `targetSku.tempDiskGB` - number
- `targetSku.maxDataDisks` - number
- `targetSku.premiumIO` - boolean

**Action Properties (`action.*`):**
- `action.encryptionOperation` - enable | disable
- `action.encryptionTarget` - os | all

### File Organization

Place rules in the appropriate directory:

```
kb/rules/
├── blockers/        # Operations that cannot proceed
├── resize-vm/       # VM resize rules
├── resize-disk/     # Disk resize rules
├── detach-disk/     # Disk detach rules
├── redeploy/        # VM redeploy rules
├── encryption/      # Disk encryption rules
├── zone-move/       # Availability zone changes
└── cross-region/    # Cross-region moves
```

---

## Adding Mitigations

Mitigations are defined in `kb/mitigations.yaml`.

```yaml
- id: my-mitigation-id
  title: Short Title
  description: What to do and why
  phase: before                     # before | during | after
  required: true                    # Is this mandatory?
  platforms: [all]                  # Windows | Linux | all
  docUrl: https://learn.microsoft.com/...
  steps:                            # Optional step-by-step
    - Step 1
    - Step 2
```

### Existing Mitigations

Before creating a new mitigation, check if one already exists:

| ID | Description |
|----|-------------|
| `backup-vm` | Create VM backup |
| `snapshot-os-disk` | Snapshot OS disk |
| `snapshot-data-disks` | Snapshot data disks |
| `stop-vm-gracefully` | Graceful OS shutdown |
| `deallocate-vm` | Deallocate VM |
| `stop-applications` | Stop dependent apps |
| `drain-connections` | Drain load balancer |
| `unmount-filesystem` | Unmount before detach |
| `remove-fstab-entry` | Update /etc/fstab |
| `offline-disk-windows` | Set disk offline |
| `deactivate-vg` | Deactivate LVM VG |
| `check-raid-health` | Verify RAID status |

See `kb/mitigations.yaml` for the full list.

---

## Testing Locally

Before submitting a PR:

```bash
# Install dependencies
npm install

# Build the knowledge base (YAML → JSON)
npm run build-kb

# Validate schemas and cross-references
npm run validate-kb

# Run the full build
npm run build
```

All commands must pass without errors.

---

## Pull Request Guidelines

1. **One feature per PR** - Don't mix unrelated changes
2. **Include sources** - Link to official Azure documentation
3. **Test locally** - Run validation before submitting
4. **Clear description** - Explain what scenario the rule covers
5. **Kebab-case IDs** - Use lowercase with hyphens

---

## Questions?

- Open an [Issue](https://github.com/rmssantos/azpact/issues) to discuss
- Check existing rules for examples
