import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import crypto from 'crypto';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import jschardet from 'jschardet';
import { horses, sales } from '../drizzle/schema';
import { getDb } from './db';
import { eq } from 'drizzle-orm';

const CACHE_DIR = path.join(process.cwd(), '.cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generate cache key from URL
 */
function getCacheKey(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Fetch and cache HTML with encoding support
 */
async function fetchAndCacheHtml(url: string): Promise<string> {
  const cacheKey = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.html`);

  // Check cache first
  if (fs.existsSync(cachePath)) {
    console.log(`✓ Using cached HTML for ${url}`);
    return fs.readFileSync(cachePath, 'utf-8');
  }

  // Fetch from URL
  console.log(`Downloading HTML from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  // Get as buffer to handle multiple encodings
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  // Detect encoding
  const detected = jschardet.detect(Buffer.from(uint8Array));
  const encoding = detected.encoding || 'utf-8';

  console.log(`Detected encoding: ${encoding} for ${url}`);

  // Decode using iconv-lite
  // HBA is usually Shift-JIS (CP932)
  const decodedHtml = iconv.decode(Buffer.from(uint8Array), encoding === 'ascii' ? 'utf-8' : encoding);

  // Save as UTF-8 in cache for easier future use
  fs.writeFileSync(cachePath, decodedHtml, 'utf-8');
  console.log(`✓ Cached HTML to ${cachePath}`);

  return decodedHtml;
}

/**
 * Fetch and cache PDF
 */
async function fetchAndCachePdf(url: string): Promise<Buffer> {
  const cacheKey = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.pdf`);

  // Check cache first
  if (fs.existsSync(cachePath)) {
    console.log(`✓ Using cached PDF for ${url}`);
    return fs.readFileSync(cachePath);
  }

  // Fetch from URL
  console.log(`Downloading PDF from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF ${url}: ${response.statusText}`);
  }

  const buffer = await response.buffer();

  // Save to cache
  fs.writeFileSync(cachePath, buffer);
  console.log(`✓ Cached PDF to ${cachePath}`);

  return buffer;
}

/**
 * Webカタログを解析する関数
 */
export async function parseCatalog(catalogUrl: string) {
  try {
    const html = await fetchAndCacheHtml(catalogUrl);
    const $ = cheerio.load(html);

    const horseList: any[] = [];

    // Find the first table
    const table = $('table').first();
    if (table.length === 0) {
      throw new Error('No table found in catalog HTML');
    }

    // Parse each row
    // Table structure (based on HTML analysis):
    // TD 0: lot number, TD 1: photo, TD 2: video, TD 3: homepage
    // TD 4: sex, TD 5: color, TD 6: birthDate
    // TD 7: sireName, TD 8: damName, TD 9: region
    // TD 10: consignor, TD 11: breeder, TD 12: result, TD 13: buyer, TD 14: price
    table.find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 15) return; // Skip rows with insufficient cells

      const lotNumber = parseInt($(cells[0]).text().trim());
      if (isNaN(lotNumber)) return; // Skip non-numeric lot numbers

      let sireName = cleanText($(cells[7]).text());
      let damName = cleanText($(cells[8]).text());

      // Fix duplicate names
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

      const rawSex = cleanText($(cells[4]).text());
      let sex: "牡" | "牝" | "セン" | null = null;
      if (rawSex.includes("牡")) sex = "牡";
      else if (rawSex.includes("牝")) sex = "牝";
      else if (rawSex.includes("セ")) sex = "セン";

      // 画像とPDFのURLをより確実に取得
      const photoCell = $(cells[1]);
      const photoLink = photoCell.find('a[data-lightbox]').attr('href') || photoCell.find('a').attr('href');
      const photoImg = photoCell.find('img').attr('src');

      // data-titleの中にある実際の画像URLを探す（HBAのLightbox構成に対応）
      let highResPhoto = null;
      const dataTitle = photoCell.find('a[data-lightbox]').attr('data-title');
      if (dataTitle) {
        try {
          const title$ = cheerio.load(dataTitle);
          const firstImg = title$('img').first().attr('src');
          if (firstImg) highResPhoto = firstImg.split('?')[0];
        } catch (e) { }
      }

      const photoUrl = (highResPhoto || photoLink || photoImg || "").split('?')[0] || null;
      const pedigreePdfUrl = ($(cells[0]).find('a').attr('href') || "").split('?')[0] || null;

      if (lotNumber <= 3) {
        console.log(`[Import Debug] Lot ${lotNumber}: photo=${photoUrl}, pdf=${pedigreePdfUrl}`);
      }

      horseList.push({
        lotNumber,
        sex,
        color: cleanText($(cells[5]).text()),
        birthDate: cleanText($(cells[6]).text()) || null,
        sireName,
        damName,
        consignor: cleanText($(cells[10]).text()),
        breeder: cleanText($(cells[11]).text()),
        priceEstimate: parseInt(cleanText($(cells[14]).text()).replace(/[^0-9]/g, "")) || null,
        photoUrl,
        videoUrl: $(cells[2]).find("a").attr("href") || null,
        pedigreePdfUrl,
      });
    });

    return horseList;
  } catch (error) {
    console.error('Error parsing catalog:', error);
    throw error;
  }
}

/**
 * Clean text from HTML
 */
function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * PDF即尺データを解析する関数
 */
export async function parsePdfMeasurements(pdfUrl: string) {
  try {
    // キャッシュから取得または新規ダウンロード
    const buffer = await fetchAndCachePdf(pdfUrl);

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
export function parseMeasurementText(text: string) {
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
        const values = match[2].trim().split(/\s+/);
        if (values.length >= 3) {
          measurements.push({
            lotNumber,
            height: parseFloat(values[0]),
            girth: parseFloat(values[1]),
            cannon: parseFloat(values[2]),
            status: null,
          });
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
    // Step 0: セリ情報の更新 (catalogUrlの同期)
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection not available');
    }

    console.log(`\n[Step 0] Syncing catalog URL and cleaning up existing data for saleId: ${saleId}...`);

    // catalogUrlを同期（詳細画面でのURL解決に使用）
    await db.update(sales)
      .set({ catalogUrl, updatedAt: new Date() })
      .where(eq(sales.id, saleId));

    // 既存のデータを削除
    await db.delete(horses).where(eq(horses.saleId, saleId));

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

      // Convert birthDate to Date object for MySQL timestamp
      // Format: "YYYY/MM/DD" (e.g., "2024/04/21")
      let birthDate: Date | null = null;
      if (horse.birthDate) {
        if (typeof horse.birthDate === 'string') {
          // Parse "YYYY/MM/DD" format
          const dateMatch = horse.birthDate.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
          if (dateMatch) {
            const [, year, month, day] = dateMatch;
            // Create date object using UTC to avoid timezone issues
            birthDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          } else {
            // Try default parsing as fallback
            const date = new Date(horse.birthDate);
            if (!isNaN(date.getTime())) {
              birthDate = date;
            }
          }
        } else if (horse.birthDate instanceof Date) {
          birthDate = horse.birthDate;
        }
      }

      return {
        ...horse,
        saleId,
        birthDate: birthDate || null,
        height: measurements?.height ? parseFloat(measurements.height.toString()) : null,
        girth: measurements?.girth ? parseFloat(measurements.girth.toString()) : null,
        cannon: measurements?.cannon ? parseFloat(measurements.cannon.toString()) : null,
      };
    });

    console.log(`✓ Merged data for ${mergedData.length} horses`);

    // Step 4: データベースに保存（バッチ挿入）
    console.log('\n[Step 4] Saving to database...');
    if (!db) {
      throw new Error('Database connection not available');
    }

    let insertedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < mergedData.length; i += batchSize) {
      const batch = mergedData.slice(i, i + batchSize);
      // Remove horseName property as it's not in the schema
      const cleanedBatch = batch.map(({ horseName, ...rest }: any) => rest);

      try {
        await db.insert(horses).values(cleanedBatch);
        insertedCount += cleanedBatch.length;
        console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${insertedCount}/${mergedData.length})`);
      } catch (err: any) {
        console.error(`Failed to insert batch starting at ${i}:`, {
          error: err.message,
          code: err.code,
          detail: err.detail,
        });
        // Try inserting individually to identify problematic records
        for (const horse of cleanedBatch) {
          try {
            await db.insert(horses).values(horse);
            insertedCount++;
          } catch (individualErr: any) {
            console.error(`Failed to insert horse ${horse.lotNumber}:`, {
              error: individualErr.message,
              detail: individualErr.detail,
              sex: horse.sex,
              birthDate: horse.birthDate,
            });
          }
        }
      }
    }

    console.log(`✓ Inserted ${insertedCount} horses into database`);

    return {
      success: insertedCount > 0,
      catalogCount: catalogData.length,
      measurementCount: measurementsMap.size,
      insertedCount,
      message: insertedCount > 0
        ? `Successfully imported ${insertedCount} horses`
        : `Warning: No horses were inserted. Check logs for details.`,
    };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}
