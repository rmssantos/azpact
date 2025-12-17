/**
 * Validation script: Validates compiled KB against Zod schemas
 * Run with: npx tsx scripts/validate-kb.ts
 */

import * as fs from "fs";
import * as path from "path";
import { ValidatedRuleSchema, MitigationSchema } from "../schemas";

const ROOT_DIR = process.cwd();
const COMPILED_DIR = path.join(ROOT_DIR, "kb/.compiled");

console.log("Validating Knowledge Base...\n");

let errors = 0;
let warnings = 0;

// Validate rules
const rulesPath = path.join(COMPILED_DIR, "rules.json");
if (fs.existsSync(rulesPath)) {
  const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
  const seenIds = new Set<string>();

  console.log(`Validating ${rules.length} rules...`);

  for (const rule of rules) {
    // Check for duplicate IDs
    if (seenIds.has(rule.id)) {
      console.error(`  ✗ Duplicate ID: ${rule.id}`);
      errors++;
    }
    seenIds.add(rule.id);

    // Validate against schema
    const result = ValidatedRuleSchema.safeParse(rule);
    if (!result.success) {
      console.error(`  ✗ Invalid rule: ${rule.id || "unknown"}`);
      for (const issue of result.error.issues) {
        console.error(`    - ${issue.path.join(".")}: ${issue.message}`);
      }
      errors++;
    }

    // Warnings for missing optional fields
    if (!rule.sources || rule.sources.length === 0) {
      console.warn(`  ⚠ Rule ${rule.id} has no sources`);
      warnings++;
    }

    // Check deprecated rules have replacement
    if (rule.deprecated && !rule.deprecatedBy) {
      console.warn(`  ⚠ Deprecated rule ${rule.id} has no replacement`);
      warnings++;
    }
  }

  if (errors === 0) {
    console.log(`  ✓ All ${rules.length} rules are valid`);
  }
} else {
  console.log("  No rules.json found (run build-kb first)");
}

// Validate mitigations
const mitigationsPath = path.join(COMPILED_DIR, "mitigations.json");
if (fs.existsSync(mitigationsPath)) {
  const mitigations = JSON.parse(fs.readFileSync(mitigationsPath, "utf-8"));
  const seenIds = new Set<string>();

  console.log(`\nValidating ${mitigations.length} mitigations...`);

  for (const mitigation of mitigations) {
    // Check for duplicate IDs
    if (seenIds.has(mitigation.id)) {
      console.error(`  ✗ Duplicate ID: ${mitigation.id}`);
      errors++;
    }
    seenIds.add(mitigation.id);

    // Validate against schema
    const result = MitigationSchema.safeParse(mitigation);
    if (!result.success) {
      console.error(`  ✗ Invalid mitigation: ${mitigation.id || "unknown"}`);
      for (const issue of result.error.issues) {
        console.error(`    - ${issue.path.join(".")}: ${issue.message}`);
      }
      errors++;
    }
  }

  if (errors === 0) {
    console.log(`  ✓ All ${mitigations.length} mitigations are valid`);
  }
} else {
  console.log("\n  No mitigations.json found (run build-kb first)");
}

// Cross-reference: check mitigations referenced by rules exist
if (fs.existsSync(rulesPath) && fs.existsSync(mitigationsPath)) {
  const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
  const mitigations = JSON.parse(fs.readFileSync(mitigationsPath, "utf-8"));
  const mitigationIds = new Set(mitigations.map((m: { id: string }) => m.id));

  console.log("\nCross-referencing mitigations...");

  const missingMitigations = new Set<string>();
  for (const rule of rules) {
    for (const mitId of rule.mitigations || []) {
      if (!mitigationIds.has(mitId)) {
        missingMitigations.add(mitId);
        console.error(
          `  ✗ Rule ${rule.id} references unknown mitigation: ${mitId}`
        );
        errors++;
      }
    }
  }

  if (missingMitigations.size === 0) {
    console.log("  ✓ All mitigation references are valid");
  }
}

// Summary
console.log(`
Validation complete!
  Errors: ${errors}
  Warnings: ${warnings}
`);

if (errors > 0) {
  process.exit(1);
}
