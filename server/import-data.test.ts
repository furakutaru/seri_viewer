import { describe, it, expect } from 'vitest';
import { parseMeasurementText } from './import-data';

describe('Import Data Functions', () => {
  describe('parseMeasurementText', () => {
    it('should extract measurement data from PDF text', () => {
      const text = `
  1   156   183   21.0
  2   157   175   19.0
  3   欠場
      `;
      
      const measurements = parseMeasurementText(text);
      
      expect(measurements).toHaveLength(3);
      expect(measurements[0]).toEqual({
        lotNumber: 1,
        height: 156,
        girth: 183,
        cannon: 21,
      });
      expect(measurements[1]).toEqual({
        lotNumber: 2,
        height: 157,
        girth: 175,
        cannon: 19,
      });
      expect(measurements[2]).toEqual({
        lotNumber: 3,
        height: null,
        girth: null,
        cannon: null,
        status: '欠場',
      });
    });

    it('should handle decimal cannon measurements', () => {
      const text = `
  1   156   183   21.5
  2   157   175   19.2
      `;
      
      const measurements = parseMeasurementText(text);
      
      expect(measurements).toHaveLength(2);
      expect(measurements[0].cannon).toBe(21.5);
      expect(measurements[1].cannon).toBe(19.2);
    });

    it('should handle multiple lot numbers with mixed data', () => {
      const text = `
  1   156   183   21.0
  2   欠場
  3   157   175   19.0
  4   欠場
  5   151   170   19.0
      `;
      
      const measurements = parseMeasurementText(text);
      
      expect(measurements).toHaveLength(5);
      expect(measurements[1].status).toBe('欠場');
      expect(measurements[3].status).toBe('欠場');
      expect(measurements[4].height).toBe(151);
    });
  });
});
