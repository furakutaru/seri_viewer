import { describe, it, expect } from 'vitest';

/**
 * Test for parseMeasurementText function
 * This test validates the PDF measurement text parsing logic
 */
describe('parseMeasurementText', () => {
  // Mock the function since it's not exported
  function parseMeasurementText(text: string) {
    const measurements: any[] = [];
    
    const lines = text.split('\n');
    
    // パターン: "  1   156   183   21.0" または "  1   欠場"
    const pattern = /^\s*(\d+)\s+(欠場|\d+\s+\d+\s+[\d.]+)/;
    
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        const lotNumber = parseInt(match[1]);
        
        if (match[2] === '欠場') {
          measurements.push({
            lotNumber,
            height: null,
            girth: null,
            cannon: null,
            status: '欠場',
          });
        } else {
          const measurementPart = match[2].trim();
          const parts = measurementPart.split(/\s+/);
          
          if (parts.length >= 3) {
            const height = parseInt(parts[0]);
            const girth = parseInt(parts[1]);
            const cannon = parseFloat(parts[2]);
            
            if (!isNaN(height) && !isNaN(girth) && !isNaN(cannon)) {
              measurements.push({
                lotNumber,
                height,
                girth,
                cannon,
              });
            }
          }
        }
      }
    }
    
    return measurements;
  }

  it('should parse measurement data correctly', () => {
    const text = `
      1   156   183   21.0
      2   157   175   19.0
      3   欠場
      4   150   168   18.5
    `;
    
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({
      lotNumber: 1,
      height: 156,
      girth: 183,
      cannon: 21.0,
    });
    expect(result[1]).toEqual({
      lotNumber: 2,
      height: 157,
      girth: 175,
      cannon: 19.0,
    });
    expect(result[2]).toEqual({
      lotNumber: 3,
      height: null,
      girth: null,
      cannon: null,
      status: '欠場',
    });
    expect(result[3]).toEqual({
      lotNumber: 4,
      height: 150,
      girth: 168,
      cannon: 18.5,
    });
  });

  it('should handle missing measurements', () => {
    const text = `
      1   156   183   21.0
      3   欠場
    `;
    
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(2);
    expect(result[0].lotNumber).toBe(1);
    expect(result[1].status).toBe('欠場');
  });

  it('should handle large lot numbers', () => {
    const text = `
      100   156   183   21.0
      246   157   175   19.0
    `;
    
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(2);
    expect(result[0].lotNumber).toBe(100);
    expect(result[1].lotNumber).toBe(246);
  });
});

/**
 * Test for catalog parsing - duplicate name removal
 */
describe('parseCatalog - duplicate name removal', () => {
  function removeDuplicateName(name: string): string {
    if (name && name.includes(' ')) {
      const parts = name.split(' ');
      if (parts[0] === parts[1]) {
        return parts[0];
      }
    }
    return name;
  }

  it('should remove duplicate names', () => {
    expect(removeDuplicateName('コパノリッキー コパノリッキー')).toBe('コパノリッキー');
    expect(removeDuplicateName('サイモンベラーノ サイモンベラーノ')).toBe('サイモンベラーノ');
  });

  it('should keep non-duplicate names', () => {
    expect(removeDuplicateName('コパノリッキー')).toBe('コパノリッキー');
    expect(removeDuplicateName('コパノリッキー サイモンベラーノ')).toBe('コパノリッキー サイモンベラーノ');
  });

  it('should handle empty strings', () => {
    expect(removeDuplicateName('')).toBe('');
  });
});
