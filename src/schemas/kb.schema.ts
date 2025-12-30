/**
 * Runtime validation schemas for Knowledge Base files
 */
import { z } from 'zod';

// Action types enum for validation
const actionTypeSchema = z.enum([
  'ResizeVM',
  'ResizeOSDisk',
  'ResizeDataDisk',
  'DetachDisk',
  'RedeployVM',
  'EnableEncryption',
  'ChangeZone',
  'CrossRegionMove',
  'StopVM',
  'DeallocateVM',
  'CaptureVM',
  'AddNIC',
  'RemoveNIC',
  'RestoreVM',
  'SwapOSDisk',
]);

// Rule condition schema
const ruleConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'in', 'nin', 'exists', 'notExists', 'gt', 'gte', 'lt', 'lte', 'matches']),
  value: z.unknown(),
});

// Rule source schema
const ruleSourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

// Rule impact schema
const ruleImpactSchema = z.object({
  reboot: z.enum(['none', 'possible', 'likely', 'guaranteed']).optional(),
  downtime: z.enum(['none', 'low', 'medium', 'high']).optional(),
  risk: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  reason: z.string(),
  affectedComponents: z.array(z.string()).optional(),
});

// Main rule schema
export const ruleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['rule', 'blocker', 'override']),
  layer: z.enum(['infra', 'guest']),
  actions: z.array(actionTypeSchema),
  conditions: z.array(ruleConditionSchema),
  overrideTargets: z.array(z.string()).optional(),
  impact: ruleImpactSchema,
  mitigations: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  sources: z.array(ruleSourceSchema).optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
  deprecated: z.boolean().optional(),
  deprecatedBy: z.string().optional(),
  deprecatedAt: z.string().optional(),
});

// Mitigation schema
export const mitigationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  phase: z.enum(['before', 'during', 'after']),
  required: z.boolean(),
  platforms: z.array(z.enum(['Windows', 'Linux', 'all'])),
  docUrl: z.string().url().optional(),
  steps: z.array(z.string()).optional(),
});

// Export array schemas
export const rulesArraySchema = z.array(ruleSchema);
export const mitigationsArraySchema = z.array(mitigationSchema);
