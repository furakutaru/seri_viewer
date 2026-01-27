import { describe, it, expect } from 'vitest';

/**
 * pdftotext -layoutで抽出したテキストから測尺データを解析
 */
function parseMeasurementText(text: string) {
  const measurements: any[] = [];
  
  const lines = text.split('\n');
  
  // 各行から上場番号と測尺データを抽出
  // パターン: "  1   156   183   21.0" または "  1   欠場"
  // 正規表現: 上場番号（1-3桁）、その後に測尺データ（体高、胸囲、管囲）または「欠場」
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
        // 測尺データを抽出
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

describe('PDF Measurement Parsing (pdftotext -layout)', () => {
  it('should parse single measurement line correctly', () => {
    const text = '  1   156   183   21.0';
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      lotNumber: 1,
      height: 156,
      girth: 183,
      cannon: 21.0,
    });
  });

  it('should parse multiple measurement lines correctly', () => {
    const text = `  1   156   183   21.0
  2   157   175   19.0
  3   151   170   19.5`;
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(3);
    expect(result[0].lotNumber).toBe(1);
    expect(result[1].lotNumber).toBe(2);
    expect(result[2].lotNumber).toBe(3);
  });

  it('should handle 欠場 (absent) correctly', () => {
    const text = `  1   156   183   21.0
  2   欠場
  3   151   170   19.5`;
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(3);
    expect(result[1]).toEqual({
      lotNumber: 2,
      height: null,
      girth: null,
      cannon: null,
      status: '欠場',
    });
  });

  it('should handle decimal cannon values', () => {
    const text = '  1   156   183   21.5';
    const result = parseMeasurementText(text);
    
    expect(result[0].cannon).toBe(21.5);
  });

  it('should handle large lot numbers', () => {
    const text = `  100   156   183   21.0
  246   157   175   19.0`;
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(2);
    expect(result[0].lotNumber).toBe(100);
    expect(result[1].lotNumber).toBe(246);
  });

  it('should ignore lines that do not match the pattern', () => {
    const text = `上場    体高    胸囲    管囲
  1   156   183   21.0
  2   157   175   19.0
販売希望価格`;
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(2);
    expect(result[0].lotNumber).toBe(1);
    expect(result[1].lotNumber).toBe(2);
  });

  it('should handle measurements with extra whitespace', () => {
    const text = '   1    156    183    21.0';
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      lotNumber: 1,
      height: 156,
      girth: 183,
      cannon: 21.0,
    });
  });

  it('should handle mixed content with measurements and non-measurements', () => {
    const text = `Header line
  1   156   183   21.0
Some other text
  2   157   175   19.0
  3   欠場
Footer line`;
    const result = parseMeasurementText(text);
    
    expect(result).toHaveLength(3);
    expect(result[0].lotNumber).toBe(1);
    expect(result[1].lotNumber).toBe(2);
    expect(result[2].status).toBe('欠場');
  });
});
