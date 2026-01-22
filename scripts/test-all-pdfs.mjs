import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// PDF即尺データを解析する関数
async function parsePdfMeasurements(pdfUrl) {
  try {
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();
    
    const tmpDir = os.tmpdir();
    const pdfPath = path.join(tmpDir, `temp_${Date.now()}.pdf`);
    const txtPath = path.join(tmpDir, `temp_${Date.now()}.txt`);
    
    fs.writeFileSync(pdfPath, Buffer.from(buffer));
    
    try {
      execSync(`pdftotext "${pdfPath}" "${txtPath}"`, { encoding: 'utf-8' });
    } catch (err) {
      console.warn('pdftotext command failed');
      throw new Error('PDF conversion failed');
    }
    
    const text = fs.readFileSync(txtPath, 'utf-8');
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
      return { error: 'Could not find header row' };
    }
    
    // 上場番号のセクションを探す
    let lotNumbersStart = headerIdx + 1;
    while (lotNumbersStart < lines.length && !/^\d+$/.test(lines[lotNumbersStart].trim())) {
      lotNumbersStart++;
    }
    
    if (lotNumbersStart >= lines.length) {
      return { error: 'Could not find lot numbers' };
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
    const measurements = [];
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
    
    fs.unlinkSync(pdfPath);
    fs.unlinkSync(txtPath);
    
    return {
      lotNumberRange: `${firstNum}-${lotNumbers[lotNumbers.length - 1]}`,
      lotNumberCount: lotNumbers.length,
      measurementCount: measurements.length,
      measurements: measurements.slice(0, 3),
    };
  } catch (error) {
    return { error: error.message };
  }
}

// テスト実行
const pdfUrls = [
  'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf',
  'https://w2.hba.or.jp/upload/1bb1dd14cc682ae38f32c2db37a28c9a/d65f979d2da9144d79365b709e3a7585.pdf',
  'https://w2.hba.or.jp/upload/8c8e5a17f063831beae0816321e46861/7867fba5c640d12c042667001f9aecad.pdf',
  'https://w2.hba.or.jp/upload/a067d828f87be220938a113587b10cc8/86cb0e8a49622ddc289f5233f5bff80c.pdf',
  'https://w2.hba.or.jp/upload/298ad79271ebc80fac6aa6cfaef813a2/68fef92e323f0a453b97cb80e3d8f35a.pdf',
  'https://w2.hba.or.jp/upload/9bdc1ccda252adae209027c616074690/23ce068eacf834d5f77ec49e71a31725.pdf',
];

console.log('Testing all PDF files...\n');

for (let i = 0; i < pdfUrls.length; i++) {
  console.log(`[${i + 1}/${pdfUrls.length}] Testing PDF...`);
  const result = await parsePdfMeasurements(pdfUrls[i]);
  
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  } else {
    console.log(`  Lot numbers: ${result.lotNumberRange} (${result.lotNumberCount} horses)`);
    console.log(`  Measurements: ${result.measurementCount} horses`);
    console.log(`  Sample: ${JSON.stringify(result.measurements[0])}`);
  }
  console.log();
}
