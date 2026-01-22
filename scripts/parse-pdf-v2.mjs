import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * PDF即尺データを抽出するスクリプト
 * pdftotext を使用してテキスト化し、データを解析
 */
export async function parsePdfMeasurements(pdfUrl, saleDate) {
  try {
    console.log(`Fetching PDF from: ${pdfUrl}`);
    
    // PDFをダウンロード
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();
    
    // 一時ファイルに保存
    const tmpDir = os.tmpdir();
    const pdfPath = path.join(tmpDir, `temp_${Date.now()}.pdf`);
    const txtPath = path.join(tmpDir, `temp_${Date.now()}.txt`);
    
    fs.writeFileSync(pdfPath, Buffer.from(buffer));
    
    // pdftotext で テキスト化
    try {
      execSync(`pdftotext "${pdfPath}" "${txtPath}"`, { encoding: 'utf-8' });
    } catch (err) {
      console.warn('pdftotext command failed');
      throw new Error('PDF conversion failed');
    }
    
    // テキストを読み込み
    const text = fs.readFileSync(txtPath, 'utf-8');
    
    // データを解析
    const measurements = parseMeasurementText(text);
    
    // 一時ファイルを削除
    fs.unlinkSync(pdfPath);
    fs.unlinkSync(txtPath);
    
    console.log(`Successfully extracted ${measurements.length} measurements`);
    return measurements;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * テキストから測尺データを解析
 * PDFの構造:
 * 番号
 * (blank)
 * （cm） （cm） （cm）
 * (blank)
 * 1, 2, 3, ..., 65 (上場番号のリスト)
 * (blank)
 * 欠場, 150, 154, 158, 151, 152, ... (測尺データ)
 * 
 * 測尺データの構造:
 * - 各上場番号に対して、体高、胸囲、管囲の3つの値
 * - 欠場の場合は "欠場" と表示
 */
function parseMeasurementText(text) {
  const measurements = [];
  
  // 行を分割
  const lines = text.split('\n');
  
  // ヘッダー行を探す（"番号" を含む行）
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
  // "番号" の行から、"1" が始まるまでスキップ
  let lotNumbersStart = headerIdx + 1;
  while (lotNumbersStart < lines.length && lines[lotNumbersStart].trim() !== '1') {
    lotNumbersStart++;
  }
  
  // 上場番号を収集（1から始まる連番のみ）
  const lotNumbers = [];
  let i = lotNumbersStart;
  let expectedNum = 1;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (/^\d+$/.test(line)) {
      const num = parseInt(line);
      
      // 連番をチェック（1, 2, 3, ..., N の形式）
      if (num === expectedNum) {
        lotNumbers.push(num);
        expectedNum++;
        i++;
      } else {
        // 連番が途切れたら、ここから測尺データ
        break;
      }
    } else if (line === '') {
      i++;
    } else {
      break;
    }
  }
  
  console.log(`Found ${lotNumbers.length} lot numbers`);
  
  // 測尺データのセクションを探す
  let measurementStart = i;
  while (measurementStart < lines.length && lines[measurementStart].trim() === '') {
    measurementStart++;
  }
  
  // 測尺データを収集
  const measurementLines = [];
  for (let j = measurementStart; j < lines.length; j++) {
    const line = lines[j].trim();
    
    // 販売希望価格などのセクションに到達したら終了
    if (line.includes('販売希望') || line.includes('価格') || line.includes('レポジトリー')) {
      break;
    }
    
    if (line !== '') {
      measurementLines.push(line);
    }
  }
  
  console.log(`Found ${measurementLines.length} measurement data lines`);
  
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

// テスト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const pdfUrl = process.argv[2] || 'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf';
  
  try {
    const measurements = await parsePdfMeasurements(pdfUrl, '20250818');
    console.log('\nFirst 20 measurements:');
    console.log(JSON.stringify(measurements.slice(0, 20), null, 2));
    console.log(`\nTotal: ${measurements.length} measurements`);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}
