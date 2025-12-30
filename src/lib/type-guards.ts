/**
 * Type Guards and Exhaustiveness Checking
 * Utilities for runtime type checking and compile-time exhaustiveness
 */

import { ActionType } from "@/types";

/**
 * Exhaustiveness check for switch statements
 * Throws error at runtime if value isn't handled
 * Causes compile error if a case is missing
 *
 * @example
 * switch (action.type) {
 *   case 'ResizeVM': return handleResize();
 *   case 'StopVM': return handleStop();
 *   // ... all other cases
 *   default: assertNever(action.type); // Compile error if case missing
 * }
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

/**
 * Check if a string is a valid ActionType
 * Useful for validating user input or URL parameters
 */
export function isValidActionType(value: unknown): value is ActionType {
  if (typeof value !== 'string') return false;

  const validActions: readonly ActionType[] = [
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
  ];

  return validActions.includes(value as ActionType);
}

/**
 * Validate and cast to ActionType, throwing if invalid
 */
export function assertActionType(value: unknown): ActionType {
  if (isValidActionType(value)) {
    return value;
  }
  throw new Error(`Invalid action type: ${value}`);
}
