import { describe, it, expect } from 'vitest';
import { evaluateImpact } from '@/lib/engine';
import type { VMContext, Action } from '@/types';

describe('Impact Evaluation Engine', () => {
  describe('Invalid SKU handling', () => {
    it('should return error for invalid source SKU', () => {
      const context: VMContext = {
        vm: { sku: 'Invalid_SKU', generation: 'Gen2', zonal: true },
        os: { family: 'Linux', distro: 'Ubuntu', version: '22.04' },
        disks: [{ lun: 0, name: 'os-disk', role: 'os', sizeGB: 128, type: 'Premium_LRS' }],
      };

      const action: Action = {
        type: 'ResizeVM',
        targetSku: 'Standard_D4s_v5',
      };

      const result = evaluateImpact(context, action);

      expect(result.blocked).toBe(true);
      expect(result.blockerReason).toContain('Invalid_SKU');
    });

    it('should return error for invalid target SKU', () => {
      const context: VMContext = {
        vm: { sku: 'Standard_D4s_v5', generation: 'Gen2', zonal: true },
        os: { family: 'Linux', distro: 'Ubuntu', version: '22.04' },
        disks: [{ lun: 0, name: 'os-disk', role: 'os', sizeGB: 128, type: 'Premium_LRS' }],
      };

      const action: Action = {
        type: 'ResizeVM',
        targetSku: 'Invalid_Target_SKU',
      };

      const result = evaluateImpact(context, action);

      expect(result.blocked).toBe(true);
      expect(result.blockerReason).toContain('Invalid_Target_SKU');
    });
  });

  describe('Basic evaluation', () => {
    it('should evaluate VM resize with valid SKUs', () => {
      const context: VMContext = {
        vm: { sku: 'Standard_D4s_v5', generation: 'Gen2', zonal: true },
        os: { family: 'Linux', distro: 'Ubuntu', version: '22.04' },
        disks: [{ lun: 0, name: 'os-disk', role: 'os', sizeGB: 128, type: 'Premium_LRS' }],
      };

      const action: Action = {
        type: 'ResizeVM',
        targetSku: 'Standard_D8s_v5',
      };

      const result = evaluateImpact(context, action);

      expect(result).toBeDefined();
      expect(result.infra).toBeDefined();
      expect(result.guest).toBeDefined();
      expect(result.matchedRules).toBeDefined();
    });

    it('should evaluate stop VM action', () => {
      const context: VMContext = {
        vm: { sku: 'Standard_D4s_v5', generation: 'Gen2', zonal: true },
        os: { family: 'Linux', distro: 'Ubuntu', version: '22.04' },
        disks: [{ lun: 0, name: 'os-disk', role: 'os', sizeGB: 128, type: 'Premium_LRS' }],
      };

      const action: Action = {
        type: 'StopVM',
      };

      const result = evaluateImpact(context, action);

      expect(result).toBeDefined();
      expect(result.blocked).toBe(false);
    });
  });

  describe('Impact levels', () => {
    it('should have valid infrastructure impact levels', () => {
      const context: VMContext = {
        vm: { sku: 'Standard_D4s_v5', generation: 'Gen2', zonal: true },
        os: { family: 'Linux', distro: 'Ubuntu', version: '22.04' },
        disks: [{ lun: 0, name: 'os-disk', role: 'os', sizeGB: 128, type: 'Premium_LRS' }],
      };

      const action: Action = {
        type: 'RedeployVM',
      };

      const result = evaluateImpact(context, action);

      expect(['none', 'possible', 'likely', 'guaranteed']).toContain(result.infra.reboot);
      expect(['none', 'low', 'medium', 'high']).toContain(result.infra.downtime);
    });

    it('should have valid guest impact levels', () => {
      const context: VMContext = {
        vm: { sku: 'Standard_D4s_v5', generation: 'Gen2', zonal: true },
        os: { family: 'Linux', distro: 'Ubuntu', version: '22.04' },
        disks: [{ lun: 0, name: 'os-disk', role: 'os', sizeGB: 128, type: 'Premium_LRS' }],
      };

      const action: Action = {
        type: 'RedeployVM',
      };

      const result = evaluateImpact(context, action);

      expect(['low', 'medium', 'high', 'critical']).toContain(result.guest.risk);
      expect(Array.isArray(result.guest.affectedComponents)).toBe(true);
    });
  });
});
