import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 改善版：テキストから測尺データを解析
 * 上場番号と測尺データの境界を「連番の終了」で判定する代わりに、
 * 「上場番号の数」と「測尺データの数」を照合する方法を使用
 */
function parseMeasurementTextV2(text) {
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
  
  // 上場番号を収集（連番チェック）
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
        // 連番が途切れた場合、ここが測尺データの開始地点
        break;
      }
    } else if (line === '') {
      i++;
    } else {
      break;
    }
  }
  
  console.log(`[DEBUG] Collected ${lotNumbers.length} lot numbers: ${firstNum}-${firstNum + lotNumbers.length - 1}`);
  
  // 測尺データを収集
  let measurementStart = i;
  while (measurementStart < lines.length && lines[measurementStart].trim() === '') {
    measurementStart++;
  }
  
  const measurementLines = [];
  for (let j = measurementStart; j < lines.length; j++) {
    const line = lines[j].trim();
    
    // 次のセクション（販売希望価格など）に到達したら終了
    if (line.includes('販売希望') || line.includes('価格') || line.includes('レポジトリー')) {
      break;
    }
    
    if (line !== '') {
      measurementLines.push(line);
    }
  }
  
  console.log(`[DEBUG] Collected ${measurementLines.length} measurement lines`);
  
  // 測尺データを上場番号に対応させる（改善版）
  let dataIdx = 0;
  for (const lotNumber of lotNumbers) {
    if (dataIdx >= measurementLines.length) {
      console.log(`[DEBUG] Ran out of measurement data at lot number ${lotNumber}`);
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
        console.log(`[DEBUG] Invalid measurement at lot ${lotNumber}: height=${height}, girth=${girth}, cannon=${cannon}`);
        dataIdx++;
      }
    } else {
      console.log(`[DEBUG] Non-numeric first line at lot ${lotNumber}: "${firstLine}"`);
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
  const measurements = parseMeasurementTextV2(text);
  
  console.log('\n=== PDF Measurement Extraction Test (V2) ===\n');
  console.log(`Total measurements extracted: ${measurements.length}\n`);
  
  // 上場番号1-5の結果を表示
  for (let lot = 1; lot <= 5; lot++) {
    const m = measurements.find(m => m.lotNumber === lot);
    console.log(`上場番号${lot}: height=${m?.height}, girth=${m?.girth}, cannon=${m?.cannon}${m?.status ? ` (${m.status})` : ''}`);
  }
  
  // 期待値との比較
  console.log('\n=== Expected vs Actual ===');
  const lot1 = measurements.find(m => m.lotNumber === 1);
  const lot2 = measurements.find(m => m.lotNumber === 2);
  
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
