import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as cheerio from 'cheerio';

/**
 * Webカタログを解析する関数
 */
async function parseCatalog(catalogUrl) {
  try {
    console.log(`Downloading catalog from: ${catalogUrl}`);
    const response = await fetch(catalogUrl);
    const html = await response.text();

    const $ = cheerio.load(html);
    const horses = [];

    // テーブル行を解析
    const rows = $('table tr');
    rows.slice(1).each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');
      
      if (cells.length < 15) return; // スキップ
      
      const lotNumber = parseInt($(cells[0]).text().trim());
      const sex = $(cells[4]).text().trim();
      const color = $(cells[5]).text().trim();
      const sireName = $(cells[8]).text().trim();
      const damName = $(cells[10]).text().trim();
      const consignor = $(cells[11]).text().trim();
      const breeder = $(cells[12]).text().trim();
      
      if (lotNumber && !isNaN(lotNumber)) {
        horses.push({
          lotNumber,
          horseName: `Horse ${lotNumber}`,
          sex: sex || null,
          color: color || null,
          sireName: sireName || null,
          damName: damName || null,
          consignor: consignor || null,
          breeder: breeder || null,
        });
      }
    });

    return horses;
  } catch (error) {
    console.error('Error parsing catalog:', error);
    throw error;
  }
}

/**
 * PDF即尺データを解析する関数
 */
async function parsePdfMeasurements(pdfUrl, saleDate) {
  try {
    console.log(`Fetching PDF from: ${pdfUrl}`);
    
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
    const measurements = parseMeasurementText(text);
    
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
 */
function parseMeasurementText(text) {
  const measurements = [];
  const lines = text.split('\n');
  
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
  
  let lotNumbersStart = headerIdx + 1;
  while (lotNumbersStart < lines.length && lines[lotNumbersStart].trim() !== '1') {
    lotNumbersStart++;
  }
  
  const lotNumbers = [];
  let i = lotNumbersStart;
  let expectedNum = 1;
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

/**
 * 実データ取り込みスクリプト
 * Webカタログ + PDF即尺データを取り込み、データベースに保存
 */
export async function importRealData(catalogUrl, pdfUrls) {
  try {
    console.log('Starting real data import...');
    
    // Step 1: Webカタログを解析
    console.log('\n[Step 1] Parsing web catalog...');
    const catalogData = await parseCatalog(catalogUrl);
    console.log(`✓ Extracted ${catalogData.length} horses from catalog`);
    
    // Step 2: PDF即尺データを解析
    console.log('\n[Step 2] Parsing PDF measurements...');
    const measurementsMap = new Map();
    for (const pdfUrl of pdfUrls) {
      const measurements = await parsePdfMeasurements(pdfUrl, '20250818');
      console.log(`✓ Extracted ${measurements.length} measurements from PDF`);
      
      for (const m of measurements) {
        measurementsMap.set(m.lotNumber, m);
      }
    }
    
    console.log(`✓ Total measurements: ${measurementsMap.size}`);
    
    // Step 3: データを統合
    console.log('\n[Step 3] Merging catalog and measurement data...');
    const mergedData = catalogData.map(horse => {
      const measurements = measurementsMap.get(horse.lotNumber);
      return {
        ...horse,
        height: measurements?.height,
        girth: measurements?.chest,
        cannon: measurements?.cannon,
        status: measurements?.status,
      };
    });
    
    console.log(`✓ Merged data for ${mergedData.length} horses`);
    
    // Step 4: データを表示
    console.log('\n[Step 4] Sample merged data:');
    console.log(JSON.stringify(mergedData.slice(0, 5), null, 2));
    
    return mergedData;
  } catch (error) {
    console.error('Error importing real data:', error);
    throw error;
  }
}

// テスト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const catalogUrl = 'https://wmp512t973.user-space.cdn.idcfcloud.net/catalog/20250801/index250818.html';
  const pdfUrls = [
    'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf',
    'https://w2.hba.or.jp/upload/1bb1dd14cc682ae38f32c2db37a28c9a/d65f979d2da9144d79365b709e3a7585.pdf',
  ];
  
  try {
    const mergedData = await importRealData(catalogUrl, pdfUrls);
    console.log(`\n✓ Successfully imported ${mergedData.length} horses`);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}
