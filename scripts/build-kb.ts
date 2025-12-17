/**
 * Build script: Compiles YAML knowledge base to JSON
 * Run with: npx tsx scripts/build-kb.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { glob } from "glob";

const ROOT_DIR = process.cwd();
const KB_DIR = path.join(ROOT_DIR, "kb");
const OUTPUT_DIR = path.join(KB_DIR, ".compiled");

console.log("Building Knowledge Base...\n");

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Track stats
let ruleCount = 0;
let mitigationCount = 0;

// Compile rules from all YAML files
const ruleFiles = glob.sync("rules/**/*.yaml", { cwd: KB_DIR });
const allRules: unknown[] = [];

for (const file of ruleFiles) {
  const filePath = path.join(KB_DIR, file);
  const content = fs.readFileSync(filePath, "utf-8");

  try {
    const parsed = yaml.parse(content);

    // Handle both single rule and array of rules
    const rules = Array.isArray(parsed) ? parsed : [parsed];

    // Filter out null/undefined entries
    const validRules = rules.filter((r) => r !== null && r !== undefined);

    allRules.push(...validRules);
    ruleCount += validRules.length;
    console.log(`  ✓ ${file} (${validRules.length} rules)`);
  } catch (err) {
    console.error(`  ✗ ${file}: ${err}`);
    process.exit(1);
  }
}

// Write compiled rules
fs.writeFileSync(
  path.join(OUTPUT_DIR, "rules.json"),
  JSON.stringify(allRules, null, 2)
);

// Compile mitigations
const mitigationsPath = path.join(KB_DIR, "mitigations.yaml");
if (fs.existsSync(mitigationsPath)) {
  try {
    const content = fs.readFileSync(mitigationsPath, "utf-8");
    const mitigations = yaml.parse(content);

    // Handle both array and object format
    const mitigationsList = Array.isArray(mitigations)
      ? mitigations
      : Object.values(mitigations);

    mitigationCount = mitigationsList.length;

    fs.writeFileSync(
      path.join(OUTPUT_DIR, "mitigations.json"),
      JSON.stringify(mitigationsList, null, 2)
    );
    console.log(`  ✓ mitigations.yaml (${mitigationCount} mitigations)`);
  } catch (err) {
    console.error(`  ✗ mitigations.yaml: ${err}`);
    process.exit(1);
  }
}

// Write build metadata
const metadata = {
  buildTime: new Date().toISOString(),
  ruleCount,
  mitigationCount,
  ruleFiles: ruleFiles.length,
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, "metadata.json"),
  JSON.stringify(metadata, null, 2)
);

console.log(`
Build complete!
  Rules: ${ruleCount}
  Mitigations: ${mitigationCount}
  Output: kb/.compiled/
`);
