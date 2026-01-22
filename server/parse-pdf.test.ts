import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

/**
 * PDF即尺データ抽出スクリプトのユニットテスト
 */

// テキストから測尺データを解析する関数（parse-pdf-v2.mjs から抽出）
function parseMeasurementText(text: string) {
  const measurements: any[] = [];
  
  const lines = text.split('\n');
  
  // ヘッダー行を探す
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('番号')) {
      headerIdx = i;
      break;
    }
  }
  
  if (headerIdx === -1) {
    return measurements;
  }
  
  // 上場番号のセクションを探す
  let lotNumbersStart = headerIdx + 1;
  while (lotNumbersStart < lines.length && !/^\d+$/.test(lines[lotNumbersStart].trim())) {
    lotNumbersStart++;
  }
  
  if (lotNumbersStart >= lines.length) {
    return measurements;
  }
  
  // 上場番号を収集
  const lotNumbers = [];
  let i = lotNumbersStart;
  let firstNum = parseInt(lines[lotNumbersStart].trim());
  let expectedNum = firstNum;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (/^\d+$/.test(line)) {
      const num = parseInt(line);
      
      if (num === expectedNum) {
        lotNumbers.push(num);
        expectedNum++;
        i++;
      } else {
        break;
      }
    } else if (line === '') {
      i++;
    } else {
      break;
    }
  }
  
  // 測尺データを収集
  let measurementStart = i;
  while (measurementStart < lines.length && lines[measurementStart].trim() === '') {
    measurementStart++;
  }
  
  const measurementLines = [];
  for (let j = measurementStart; j < lines.length; j++) {
    const line = lines[j].trim();
    
    if (line.includes('販売希望') || line.includes('価格') || line.includes('レポジトリー')) {
      break;
    }
    
    if (line !== '') {
      measurementLines.push(line);
    }
  }
  
  // 測尺データを上場番号に対応させる
  let dataIdx = 0;
  for (const lotNumber of lotNumbers) {
    if (dataIdx >= measurementLines.length) {
      break;
    }
    
    const firstLine = measurementLines[dataIdx];
    
    if (firstLine === '欠場') {
      measurements.push({
        lotNumber,
        height: null,
        chest: null,
        cannon: null,
        status: '欠場',
      });
      dataIdx++;
    } else if (/^\d+$/.test(firstLine)) {
      const height = parseInt(firstLine);
      const chest = dataIdx + 1 < measurementLines.length ? parseInt(measurementLines[dataIdx + 1]) : null;
      const cannon = dataIdx + 2 < measurementLines.length ? parseInt(measurementLines[dataIdx + 2]) : null;
      
      if (!isNaN(height) && !isNaN(chest) && !isNaN(cannon)) {
        measurements.push({
          lotNumber,
          height,
          chest,
          cannon,
        });
        dataIdx += 3;
      } else {
        dataIdx++;
      }
    } else {
      dataIdx++;
    }
  }
  
  return measurements;
}

describe('PDF即尺データ抽出', () => {
  let testPdfPath: string;
  let testTxtPath: string;

  beforeAll(() => {
    testPdfPath = path.join(os.tmpdir(), `test_${Date.now()}.pdf`);
    testTxtPath = path.join(os.tmpdir(), `test_${Date.now()}.txt`);
  });

  afterAll(() => {
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
    if (fs.existsSync(testTxtPath)) {
      fs.unlinkSync(testTxtPath);
    }
  });

  it('上場番号 1-65 のPDFを正しく解析できる', async () => {
    const pdfUrl = 'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf';
    
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(testPdfPath, Buffer.from(buffer));
    
    execSync(`pdftotext "${testPdfPath}" "${testTxtPath}"`);
    const text = fs.readFileSync(testTxtPath, 'utf-8');
    
    const measurements = parseMeasurementText(text);
    
    // 基本的な検証
    expect(measurements.length).toBeGreaterThan(0);
    expect(measurements[0].lotNumber).toBe(1);
    expect(measurements[0].height).toBeGreaterThan(0);
  });

  it('上場番号 247-311 のPDFを正しく解析できる', async () => {
    const pdfUrl = 'https://w2.hba.or.jp/upload/1bb1dd14cc682ae38f32c2db37a28c9a/d65f979d2da9144d79365b709e3a7585.pdf';
    
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(testPdfPath, Buffer.from(buffer));
    
    execSync(`pdftotext "${testPdfPath}" "${testTxtPath}"`);
    const text = fs.readFileSync(testTxtPath, 'utf-8');
    
    const measurements = parseMeasurementText(text);
    
    // 基本的な検証
    expect(measurements.length).toBeGreaterThan(0);
    expect(measurements[0].lotNumber).toBe(247);
  });

  it('欠場の馬を正しく処理できる', async () => {
    const pdfUrl = 'https://w2.hba.or.jp/upload/1bb1dd14cc682ae38f32c2db37a28c9a/d65f979d2da9144d79365b709e3a7585.pdf';
    
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(testPdfPath, Buffer.from(buffer));
    
    execSync(`pdftotext "${testPdfPath}" "${testTxtPath}"`);
    const text = fs.readFileSync(testTxtPath, 'utf-8');
    
    const measurements = parseMeasurementText(text);
    
    // 欠場の馬を探す
    const absentHorse = measurements.find((m) => m.status === '欠場');
    expect(absentHorse).toBeDefined();
    expect(absentHorse?.height).toBeNull();
    expect(absentHorse?.chest).toBeNull();
    expect(absentHorse?.cannon).toBeNull();
  });

  it('測尺データが正しい範囲内にある', async () => {
    const pdfUrl = 'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf';
    
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(testPdfPath, Buffer.from(buffer));
    
    execSync(`pdftotext "${testPdfPath}" "${testTxtPath}"`);
    const text = fs.readFileSync(testTxtPath, 'utf-8');
    
    const measurements = parseMeasurementText(text);
    
    // 測尺データの妥当性チェック
    for (const m of measurements) {
      if (m.status !== '欠場' && m.height && m.chest && m.cannon) {
        expect(typeof m.height).toBe('number');
        expect(m.height).toBeGreaterThanOrEqual(140);
        expect(m.height).toBeLessThanOrEqual(170);
        expect(typeof m.chest).toBe('number');
        expect(m.chest).toBeGreaterThanOrEqual(140);
        expect(m.chest).toBeLessThanOrEqual(200);
        expect(typeof m.cannon).toBe('number');
        expect(m.cannon).toBeGreaterThanOrEqual(140);
        expect(m.cannon).toBeLessThanOrEqual(200);
      }
    }
  });

  it('複数のPDFから異なる上場番号範囲を抽出できる', async () => {
    const pdfUrls = [
      'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf',
      'https://w2.hba.or.jp/upload/1bb1dd14cc682ae38f32c2db37a28c9a/d65f979d2da9144d79365b709e3a7585.pdf',
      'https://w2.hba.or.jp/upload/8c8e5a17f063831beae0816321e46861/7867fba5c640d12c042667001f9aecad.pdf',
    ];

    const allMeasurements: any[] = [];

    for (const pdfUrl of pdfUrls) {
      const response = await fetch(pdfUrl);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(testPdfPath, Buffer.from(buffer));
      
      execSync(`pdftotext "${testPdfPath}" "${testTxtPath}"`);
      const text = fs.readFileSync(testTxtPath, 'utf-8');
      
      const measurements = parseMeasurementText(text);
      allMeasurements.push(...measurements);
    }

    // 複数のPDFから測尺データが抽出されたことを確認
    expect(allMeasurements.length).toBeGreaterThan(50);

    // 異なる上場番号範囲が含まれていることを確認
    const lotNumbers = allMeasurements.map((m) => m.lotNumber);
    expect(Math.min(...lotNumbers)).toBe(1);
    expect(Math.max(...lotNumbers)).toBeGreaterThan(100);
  });
});
