import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as cheerio from 'cheerio';
import { getDb } from './db';
import { horses, sales } from '../drizzle/schema';

/**
 * Webカタログを解析する関数
 */
export async function parseCatalog(catalogUrl: string) {
  try {
    console.log(`Downloading catalog from: ${catalogUrl}`);
    const response = await fetch(catalogUrl);
    const html = await response.text();

    const $ = cheerio.load(html);
    const horseList: any[] = [];

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
        horseList.push({
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

    return horseList;
  } catch (error) {
    console.error('Error parsing catalog:', error);
    throw error;
  }
}

/**
 * PDF即尺データを解析する関数
 */
export async function parsePdfMeasurements(pdfUrl: string) {
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
        chest: null,
        cannon: null,
        status: '欠場',
      });
      dataIdx++;
    } else if (/^\d+$/.test(firstLine)) {
      const height = parseInt(firstLine);
      const chestStr = dataIdx + 1 < measurementLines.length ? measurementLines[dataIdx + 1] : null;
      const cannonStr = dataIdx + 2 < measurementLines.length ? measurementLines[dataIdx + 2] : null;
      const chest = chestStr ? parseInt(chestStr) : null;
      const cannon = cannonStr ? parseInt(cannonStr) : null;
      
      if (!isNaN(height) && chest !== null && !isNaN(chest) && cannon !== null && !isNaN(cannon)) {
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
 * Webカタログ + PDF即尺データを統合してデータベースに取り込む
 */
export async function importCatalogAndMeasurements(
  saleId: number,
  catalogUrl: string,
  pdfUrls: string[]
) {
  try {
    console.log('Starting data import...');
    
    // Step 1: Webカタログを解析
    console.log('\n[Step 1] Parsing web catalog...');
    const catalogData = await parseCatalog(catalogUrl);
    console.log(`✓ Extracted ${catalogData.length} horses from catalog`);
    
    // Step 2: PDF即尺データを解析
    console.log('\n[Step 2] Parsing PDF measurements...');
    const measurementsMap = new Map();
    for (const pdfUrl of pdfUrls) {
      const measurements = await parsePdfMeasurements(pdfUrl);
      console.log(`✓ Extracted ${measurements.length} measurements from PDF`);
      
      for (const m of measurements) {
        measurementsMap.set(m.lotNumber, m);
      }
    }
    
    console.log(`✓ Total measurements: ${measurementsMap.size}`);
    
    // Step 3: データを統合
    console.log('\n[Step 3] Merging catalog and measurement data...');
    const mergedData = catalogData.map((horse: any) => {
      const measurements = measurementsMap.get(horse.lotNumber);
      return {
        ...horse,
        saleId,
        height: measurements?.height ? parseFloat(measurements.height.toString()) : null,
        girth: measurements?.chest ? parseFloat(measurements.chest.toString()) : null,
        cannon: measurements?.cannon ? parseFloat(measurements.cannon.toString()) : null,
      };
    });
    
    console.log(`✓ Merged data for ${mergedData.length} horses`);
    
    // Step 4: データベースに保存
    console.log('\n[Step 4] Saving to database...');
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    let insertedCount = 0;
    for (const horse of mergedData) {
      try {
        const values: any = {
          saleId: horse.saleId,
          lotNumber: horse.lotNumber,
          horseName: horse.horseName,
        };
        
        if (horse.sex) values.sex = horse.sex;
        if (horse.color) values.color = horse.color;
        if (horse.sireName) values.sireName = horse.sireName;
        if (horse.damName) values.damName = horse.damName;
        if (horse.consignor) values.consignor = horse.consignor;
        if (horse.breeder) values.breeder = horse.breeder;
        if (horse.height) values.height = horse.height;
        if (horse.girth) values.girth = horse.girth;
        if (horse.cannon) values.cannon = horse.cannon;
        
        await db.insert(horses).values(values);
        insertedCount++;
      } catch (error) {
        console.warn(`Failed to insert horse ${horse.lotNumber}:`, error);
      }
    }
    
    console.log(`✓ Inserted ${insertedCount} horses into database`);
    
    return {
      success: true,
      catalogCount: catalogData.length,
      measurementCount: measurementsMap.size,
      insertedCount,
    };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}
