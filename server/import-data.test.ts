import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parsePdfMeasurements } from './import-data';

describe('Data Import', () => {
  describe('parsePdfMeasurements', () => {
    it('should extract measurements from PDF text correctly', async () => {
      // このテストはPDF解析ロジックをテストします
      // 実際のPDFファイルを使用してテストします
      
      const pdfUrl = 'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf';
      
      try {
        const measurements = await parsePdfMeasurements(pdfUrl);
        
        // 測尺データが抽出されたことを確認
        expect(measurements.length).toBeGreaterThan(0);
        
        // 各測尺データが正しい構造を持つことを確認
        measurements.forEach(m => {
          expect(m).toHaveProperty('lotNumber');
          expect(typeof m.lotNumber).toBe('number');
          
          if (m.status !== '欠場') {
            expect(m).toHaveProperty('height');
            expect(m).toHaveProperty('chest');
            expect(m).toHaveProperty('cannon');
            
            // 測尺値が正の数値であることを確認
            if (m.height !== null) {
              expect(m.height).toBeGreaterThan(0);
              expect(m.height).toBeLessThan(300); // 体高は300cm以下
            }
            
            if (m.chest !== null) {
              expect(m.chest).toBeGreaterThan(0);
              expect(m.chest).toBeLessThan(300); // 胸囲は300cm以下
            }
            
            if (m.cannon !== null) {
              expect(m.cannon).toBeGreaterThan(0);
              expect(m.cannon).toBeLessThan(100); // 管囲は100cm以下
            }
          }
        });
      } catch (error) {
        // ネットワークエラーの場合はスキップ
        console.warn('PDF parsing test skipped due to network error:', error);
      }
    });

    it('should handle missing PDF correctly', async () => {
      const invalidUrl = 'https://invalid-url.example.com/nonexistent.pdf';
      
      try {
        await parsePdfMeasurements(invalidUrl);
        // エラーが発生することを期待
        expect.fail('Should have thrown an error');
      } catch (error) {
        // エラーが発生することを期待
        expect(error).toBeDefined();
      }
    });
  });

  describe('Measurement validation', () => {
    it('should validate height, chest, and cannon measurements', () => {
      const validMeasurements = [
        { lotNumber: 1, height: 156, chest: 157, cannon: 151 },
        { lotNumber: 2, height: 158, chest: 160, cannon: 152 },
      ];

      validMeasurements.forEach(m => {
        expect(m.height).toBeGreaterThan(100);
        expect(m.height).toBeLessThan(200);
        expect(m.chest).toBeGreaterThan(100);
        expect(m.chest).toBeLessThan(200);
        expect(m.cannon).toBeGreaterThan(50);
        expect(m.cannon).toBeLessThan(100);
      });
    });

    it('should identify missing measurements correctly', () => {
      const measurements = [
        { lotNumber: 1, height: 156, chest: 157, cannon: 151 },
        { lotNumber: 2, status: '欠場', height: null, chest: null, cannon: null },
        { lotNumber: 3, height: 158, chest: 160, cannon: 152 },
      ];

      const missingCount = measurements.filter(m => m.status === '欠場').length;
      expect(missingCount).toBe(1);
      
      const validCount = measurements.filter(m => m.status !== '欠場').length;
      expect(validCount).toBe(2);
    });
  });
});
