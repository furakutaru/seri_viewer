import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as cheerio from 'cheerio';
import { getDb } from './db';
import { horses, sales } from '../drizzle/schema';
import iconv from 'iconv-lite';

/**
 * Webカタログを解析する関数
 */
export async function parseCatalog(catalogUrl: string) {
  try {
    console.log(`Downloading catalog from: ${catalogUrl}`);
    const response = await fetch(catalogUrl);
    const buffer = await response.arrayBuffer();
    // Shift_JIS から UTF-8 に変換
    const html = iconv.decode(Buffer.from(buffer), 'Shift_JIS');

    const $ = cheerio.load(html);
    const horseList: any[] = [];

    // テクストクリーンアップ関数
    const cleanText = (text: string) => {
      return text
        .trim()
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[^\x00-\x7F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g, ''); // 日本語と ASCII のみを保持
    };

    // テーブル行を解析
    // 最初のテーブルのみを使用
    const table = $('table').first();
    if (table.length === 0) {
      throw new Error('No table found in catalog HTML');
    }
    
    const rows = table.find('tr');
    rows.slice(1).each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');
      
      if (cells.length < 15) return; // スキップ
      
      const lotNumber = parseInt($(cells[0]).text().trim());
      // テーブル構造: No, 写真, 動画, HP, 性, 毛色, 生月日, 父馬名, 母馬名, 地区, 申込者名, 飼養者名, 結果, 購買者名, 落札額
      // セルインデックス: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
      const sex = cleanText($(cells[4]).text());
      const color = cleanText($(cells[5]).text());
      const birthDate = cleanText($(cells[6]).text());
      let sireName = cleanText($(cells[7]).text());
      let damName = cleanText($(cells[8]).text());
      const consignor = cleanText($(cells[10]).text());
      const breeder = cleanText($(cells[11]).text());
      
      // 父馬名と母馬名が重複している場合の修正
      // 例: "コパノリッキー コパノリッキー" -> "コパノリッキー"
      if (sireName && sireName.includes(' ')) {
        const parts = sireName.split(' ');
        if (parts[0] === parts[1]) {
          sireName = parts[0];
        }
      }
      if (damName && damName.includes(' ')) {
        const parts = damName.split(' ');
        if (parts[0] === parts[1]) {
          damName = parts[0];
        }
      }
      
      if (lotNumber && !isNaN(lotNumber)) {
        horseList.push({
          lotNumber,
          horseName: null, // 馬名は登録前なので不要
          sex: sex && sex.length > 0 ? sex : null,
          color: color && color.length > 0 ? color : null,
          birthDate: birthDate && birthDate.length > 0 ? birthDate : null,
          sireName: sireName && sireName.length > 0 ? sireName : null,
          damName: damName && damName.length > 0 ? damName : null,
          consignor: consignor && consignor.length > 0 ? consignor : null,
          breeder: breeder && breeder.length > 0 ? breeder : null,
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
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const tmpDir = os.tmpdir();
    const pdfPath = path.join(tmpDir, `temp_${Date.now()}.pdf`);
    const txtPath = path.join(tmpDir, `temp_${Date.now()}.txt`);
    
    if (buffer) {
      fs.writeFileSync(pdfPath, buffer instanceof Buffer ? buffer : Buffer.from(buffer));
    } else {
      throw new Error('Failed to fetch PDF');
    }
    
    try {
      execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { encoding: 'utf-8' });
    } catch (err) {
      console.warn('pdftotext command failed');
      throw new Error('PDF conversion failed');
    }
    
    const text = fs.readFileSync(txtPath, 'utf-8');
    const measurements = parseMeasurementText(text);
    
    try {
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(txtPath);
    } catch (e) {
      // 削除失敗を無視
    }
    
    console.log(`Successfully extracted ${measurements.length} measurements`);
    return measurements;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * テキストから測尺データを解析（pdftotext -layout用）
 * PDFのレイアウトを保持したテキストから、各行の上場番号と測尺データを抽出
 */
function parseMeasurementText(text: string) {
  const measurements: any[] = [];
  
  const lines = text.split('\n');
  
  // 各行から上場番号と測尺データを抽出
  // パターン: "  1   156   183   21.0" または "  1   欠場"
  // 正規表現: 上場番号（1-3桁）、その後に測尺データ（体高、胸囲、管囲）または「欠場」
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
        girth: measurements?.girth ? parseFloat(measurements.girth.toString()) : null,
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
        
        // sex の値を enum に合わせてフィルタリング
        if (horse.sex) {
          const validSex = ['牡', '牝', 'セン'];
          if (validSex.includes(horse.sex)) {
            values.sex = horse.sex;
          } else {
            console.log(`[DEBUG] Invalid sex value for horse ${horse.lotNumber}: ${horse.sex}`);
          }
        }
        
        if (horse.color) values.color = horse.color;
        if (horse.sireName) values.sireName = horse.sireName;
        if (horse.damName) values.damName = horse.damName;
        if (horse.consignor) values.consignor = horse.consignor;
        if (horse.breeder) values.breeder = horse.breeder;
        if (horse.height) values.height = horse.height;
        if (horse.girth) values.girth = horse.girth;
        if (horse.cannon) values.cannon = horse.cannon;
        
        console.log(`[DEBUG] Inserting horse ${horse.lotNumber}:`, JSON.stringify(values));
        await db.insert(horses).values(values);
        insertedCount++;
      } catch (error: any) {
        console.error(`Failed to insert horse ${horse.lotNumber}:`, error);
        if (error.message) console.error(`Error message: ${error.message}`);
        if (error.query) console.error(`Query: ${error.query}`);
        if (error.params) console.error(`Params: ${JSON.stringify(error.params)}`);
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
