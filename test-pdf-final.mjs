import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 改善版：テキストから測尺データを解析（pdftotext -layout用）
 */
function parseMeasurementText(text) {
  const measurements = [];
  
  const lines = text.split('\n');
  
  // 各行から上場番号と測尺データを抽出
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

// テスト実行
const pdfPath = '/home/ubuntu/seri_viewer/.cache/48ebc3f0f7582a3962a1115f2d858b7b.pdf';
const tmpDir = os.tmpdir();
const txtPath = path.join(tmpDir, `test_final_${Date.now()}.txt`);

try {
  execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { encoding: 'utf-8' });
  const text = fs.readFileSync(txtPath, 'utf-8');
  const measurements = parseMeasurementText(text);
  
  console.log('=== PDF Measurement Extraction Test (Final) ===\n');
  console.log(`Total measurements extracted: ${measurements.length}\n`);
  
  // 上場番号1-10の結果を表示
  for (let lot = 1; lot <= 10; lot++) {
    const m = measurements.find(m => m.lotNumber === lot);
    if (m) {
      console.log(`上場番号${lot}: height=${m.height}, girth=${m.girth}, cannon=${m.cannon}${m.status ? ` (${m.status})` : ''}`);
    } else {
      console.log(`上場番号${lot}: NOT FOUND`);
    }
  }
  
  // 期待値との比較
  console.log('\n=== Expected vs Actual ===');
  const lot1 = measurements.find(m => m.lotNumber === 1);
  const lot2 = measurements.find(m => m.lotNumber === 2);
  
  console.log('上場番号1 (Expected: height=156, girth=183, cannon=21.0)');
  console.log(`  Actual: height=${lot1?.height}, girth=${lot1?.girth}, cannon=${lot1?.cannon}`);
  console.log(`  Match: ${lot1?.height === 156 && lot1?.girth === 183 && lot1?.cannon === 21.0 ? '✓' : '✗'}`);
  
  console.log('\n上場番号2 (Expected: height=157, girth=175, cannon=19.0)');
  console.log(`  Actual: height=${lot2?.height}, girth=${lot2?.girth}, cannon=${lot2?.cannon}`);
  console.log(`  Match: ${lot2?.height === 157 && lot2?.girth === 175 && lot2?.cannon === 19.0 ? '✓' : '✗'}`);
  
  fs.unlinkSync(txtPath);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
