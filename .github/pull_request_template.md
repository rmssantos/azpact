## Description

<!-- Briefly describe what this PR adds or changes -->

## Type of Change

- [ ] New rule(s)
- [ ] New mitigation(s)
- [ ] Bug fix
- [ ] Documentation update
- [ ] Other (please describe)

## Checklist

### For Rule Contributions

- [ ] Rule ID is unique and in kebab-case (e.g., `my-new-rule`)
- [ ] Rule has a clear `name` and `description`
- [ ] Rule includes at least one `source` with official Azure documentation
- [ ] Impact fields match the layer (`infra` → reboot/downtime, `guest` → risk)
- [ ] Referenced mitigations exist in `kb/mitigations.yaml`
- [ ] Tested locally with `npm run validate-kb`

### For Mitigation Contributions

- [ ] Mitigation ID is unique and in kebab-case
- [ ] Includes `docUrl` when available
- [ ] `phase` is correctly set (before/during/after)
- [ ] `platforms` is correctly specified

### General

- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
- [ ] All validation checks pass (`npm run build-kb && npm run validate-kb`)
- [ ] The build succeeds (`npm run build`)

## Scenario Covered

<!-- Describe the Azure scenario this rule addresses -->

## Related Issues

<!-- Link any related issues: Fixes #123 -->
