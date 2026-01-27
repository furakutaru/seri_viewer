import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * pdftotext -layoutで抽出したテキストから測尺データを解析
 */
function parseMeasurementTextLayout(text) {
  const measurements = [];
  
  const lines = text.split('\n');
  
  // 各行から上場番号と測尺データを抽出
  // パターン: "  1   156   157   151" または "  1   欠場"
  const pattern = /^\s*(\d+)\s+(欠場|(\d+)\s+(\d+)\s+([\d.]+))/;
  
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
        const height = parseInt(match[3]);
        const girth = parseInt(match[4]);
        const cannon = parseFloat(match[5]);
        
        measurements.push({
          lotNumber,
          height,
          girth,
          cannon,
        });
      }
    }
  }
  
  return measurements;
}

// テスト実行
const pdfPath = '/home/ubuntu/seri_viewer/.cache/48ebc3f0f7582a3962a1115f2d858b7b.pdf';
const tmpDir = os.tmpdir();
const txtPath = path.join(tmpDir, `test_layout_${Date.now()}.txt`);

try {
  execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { encoding: 'utf-8' });
  const text = fs.readFileSync(txtPath, 'utf-8');
  const measurements = parseMeasurementTextLayout(text);
  
  console.log('=== PDF Measurement Extraction Test (Layout) ===\n');
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
  
  console.log('上場番号1 (Expected: height=156, girth=157, cannon=151)');
  console.log(`  Actual: height=${lot1?.height}, girth=${lot1?.girth}, cannon=${lot1?.cannon}`);
  console.log(`  Match: ${lot1?.height === 156 && lot1?.girth === 157 && lot1?.cannon === 151 ? '✓' : '✗'}`);
  
  console.log('\n上場番号2 (Expected: height=157, girth=182, cannon=20.5)');
  console.log(`  Actual: height=${lot2?.height}, girth=${lot2?.girth}, cannon=${lot2?.cannon}`);
  console.log(`  Match: ${lot2?.height === 157 && lot2?.girth === 182 && lot2?.cannon === 20.5 ? '✓' : '✗'}`);
  
  fs.unlinkSync(txtPath);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
