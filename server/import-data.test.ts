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
        status: null,
      });
      expect(measurements[1]).toEqual({
        lotNumber: 2,
        height: 157,
        girth: 175,
        cannon: 19,
        status: null,
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

    it('should handle multi-column layout', () => {
      const text = `
    1   156   183   21.0     701   158   185   21.5
    2   157   175   19.0     702   159   186   22.0
    3   欠場                   703   150   170   19.0
      `;

      const measurements = parseMeasurementText(text);

      expect(measurements).toHaveLength(6);
      expect(measurements[0].lotNumber).toBe(1);
      expect(measurements[1].lotNumber).toBe(701);
      expect(measurements[1].cannon).toBe(21.5);
      expect(measurements[2].lotNumber).toBe(2);
      expect(measurements[3].lotNumber).toBe(702);
      expect(measurements[4].lotNumber).toBe(3);
      expect(measurements[4].status).toBe('欠場');
      expect(measurements[5].lotNumber).toBe(703);
    });

    it('should handle squashed text (no spaces) from pdf-parse', () => {
      const text = `
115618321.0450万提出 70115818521.5
215717519.0300万      70215918622.0
3欠場                  70315017019.0
      `;

      const measurements = parseMeasurementText(text);

      expect(measurements).toHaveLength(6);
      expect(measurements[0].lotNumber).toBe(1);
      expect(measurements[0].height).toBe(156);
      expect(measurements[1].lotNumber).toBe(701);
      expect(measurements[1].height).toBe(158);
      expect(measurements[4].lotNumber).toBe(3);
      expect(measurements[4].status).toBe('欠場');
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
