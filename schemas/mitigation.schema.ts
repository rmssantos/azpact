import { z } from "zod";

export const MitigationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "ID must be kebab-case"),
  title: z.string().min(1),
  description: z.string().min(1),

  // Timing
  phase: z.enum(["before", "during", "after"]).default("before"),

  // Importance
  required: z.boolean().default(false),

  // Platform
  platforms: z
    .array(z.enum(["Windows", "Linux", "all"]))
    .default(["all"]),

  // Documentation
  docUrl: z.string().url().optional(),
  steps: z.array(z.string()).optional(),
});

export type Mitigation = z.infer<typeof MitigationSchema>;
