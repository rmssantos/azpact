/**
 * Application Constants
 * Centralized constants to avoid magic numbers and improve maintainability
 */

/**
 * Azure VM data disk count options
 * Based on common Azure VM SKU capabilities
 * - 0: No data disks
 * - 1, 2, 4: Small to medium VMs
 * - 8, 16: Large VMs
 * - 32: Extra large VMs (max for most SKUs)
 */
export const DISK_COUNT_OPTIONS = [0, 1, 2, 4, 8, 16, 32] as const;

/**
 * Default timeout for copied state (milliseconds)
 */
export const COPY_FEEDBACK_TIMEOUT = 2000;

/**
 * Mobile breakpoint width (pixels)
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Animation durations (milliseconds)
 */
export const ANIMATION_DURATIONS = {
  short: 200,
  medium: 300,
  long: 500,
} as const;

/**
 * Z-index layers for proper stacking
 */
export const Z_INDEX = {
  background: 0,
  content: 10,
  drawer: 40,
  modal: 50,
  tooltip: 60,
} as const;
