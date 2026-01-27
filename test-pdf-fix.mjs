import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * テキストから測尺データを解析（修正版）
 */
function parseMeasurementText(text) {
  const measurements = [];
  
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
    console.warn('Could not find header row in PDF');
    return measurements;
  }
  
  // 上場番号のセクションを探す
  let lotNumbersStart = headerIdx + 1;
  while (lotNumbersStart < lines.length && !/^\d+$/.test(lines[lotNumbersStart].trim())) {
    lotNumbersStart++;
  }
  
  if (lotNumbersStart >= lines.length) {
    console.warn('Could not find lot numbers in PDF');
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
        girth: null,
        cannon: null,
        status: '欠場',
      });
      dataIdx++;
    } else if (/^\d+$/.test(firstLine)) {
      const height = parseInt(firstLine);
      const girthStr = dataIdx + 1 < measurementLines.length ? measurementLines[dataIdx + 1] : null;
      const cannonStr = dataIdx + 2 < measurementLines.length ? measurementLines[dataIdx + 2] : null;
      const girth = girthStr ? parseInt(girthStr) : null;
      const cannon = cannonStr ? parseInt(cannonStr) : null;
      
      if (!isNaN(height) && girth !== null && !isNaN(girth) && cannon !== null && !isNaN(cannon)) {
        measurements.push({
          lotNumber,
          height,
          girth,
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

// テスト実行
const pdfPath = '/home/ubuntu/seri_viewer/.cache/48ebc3f0f7582a3962a1115f2d858b7b.pdf';
const tmpDir = os.tmpdir();
const txtPath = path.join(tmpDir, `test_${Date.now()}.txt`);

try {
  execSync(`pdftotext "${pdfPath}" "${txtPath}"`, { encoding: 'utf-8' });
  const text = fs.readFileSync(txtPath, 'utf-8');
  const measurements = parseMeasurementText(text);
  
  console.log('=== PDF Measurement Extraction Test ===\n');
  console.log(`Total measurements extracted: ${measurements.length}\n`);
  
  // 上場番号1と2の結果を表示
  const lot1 = measurements.find(m => m.lotNumber === 1);
  const lot2 = measurements.find(m => m.lotNumber === 2);
  
  console.log('上場番号1:');
  console.log(JSON.stringify(lot1, null, 2));
  console.log('\n上場番号2:');
  console.log(JSON.stringify(lot2, null, 2));
  
  // 期待値との比較
  console.log('\n=== Expected vs Actual ===');
  console.log('上場番号1 (Expected: height=156, girth=157, cannon=151)');
  console.log(`  Actual: height=${lot1?.height}, girth=${lot1?.girth}, cannon=${lot1?.cannon}`);
  console.log(`  Match: ${lot1?.height === 156 && lot1?.girth === 157 && lot1?.cannon === 151 ? '✓' : '✗'}`);
  
  console.log('\n上場番号2 (Expected: height=157, girth=151, cannon=157)');
  console.log(`  Actual: height=${lot2?.height}, girth=${lot2?.girth}, cannon=${lot2?.cannon}`);
  console.log(`  Match: ${lot2?.height === 157 && lot2?.girth === 151 && lot2?.cannon === 157 ? '✓' : '✗'}`);
  
  fs.unlinkSync(txtPath);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
