import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import crypto from 'crypto';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import jschardet from 'jschardet';
// @ts-ignore - pdf-parse types are tricky sometimes
import pdfParse from 'pdf-parse';
import { horses, sales } from '../drizzle/schema';
import { getDb } from './db';
import { eq } from 'drizzle-orm';

const CACHE_DIR = path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), '.cache');

// Ensure cache directory exists, gracefully bypass if read-only
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("[Warning] Could not create CACHE_DIR", e);
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
export async function fetchAndCacheHtml(url: string): Promise<string> {
  const cacheKey = getCacheKey(url);
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.html`);

  // Check cache first
  if (fs.existsSync(cachePath)) {
    console.log(`✓ Using cached HTML for ${url}`);
    return fs.readFileSync(cachePath, 'utf-8');
  }

  // Fetch from URL
  console.log(`Downloading HTML from ${url}...`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  // Get as buffer to handle multiple encodings
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  // HTML declares Shift_JIS but actual content might be UTF-8, try both
  console.log(`Testing encoding conversions for ${url}`);

  // First try as UTF-8
  const asUtf8 = Buffer.from(uint8Array).toString('utf-8');
  const hasVuInUtf8 = asUtf8.includes('ヴ');

  if (hasVuInUtf8) {
    console.log(`Found ヴ characters in UTF-8, using UTF-8 decoding for ${url}`);
    const decodedHtml = asUtf8;
    fs.writeFileSync(cachePath, decodedHtml, 'utf-8');
    console.log(`✓ Cached HTML to ${cachePath}`);
    return decodedHtml;
  }

  // Try as Shift_JIS and convert to UTF-8
  const asShiftJis = iconv.decode(Buffer.from(uint8Array), 'Shift_JIS');
  const hasVuInShiftJis = asShiftJis.includes('ヴ');

  if (hasVuInShiftJis) {
    console.log(`Found ヴ characters in Shift_JIS conversion, using Shift_JIS to UTF-8 for ${url}`);
    const decodedHtml = asShiftJis;
    fs.writeFileSync(cachePath, decodedHtml, 'utf-8');
    console.log(`✓ Cached HTML to ${cachePath}`);
    return decodedHtml;
  }

  // Fallback to UTF-8
  console.log(`No ヴ characters found, using UTF-8 fallback for ${url}`);
  const decodedHtml = asUtf8;
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

      // Extract names from uma-name attribute to avoid duplicates
      let sireName = '';
      let damName = '';

      // Find the photo link with uma-id that contains this lot number
      // Find the photo link within the current row to get the uma-name accurately
      // Use both local row search and No.X pattern to be extra safe
      let photoLinkForName = $(row).find(`a[uma-name*="No.${lotNumber} "]`).first();
      if (photoLinkForName.length === 0) {
        photoLinkForName = $(row).find(`a[uma-name*="No.${lotNumber}　"]`).first();
      }
      if (photoLinkForName.length === 0) {
        photoLinkForName = $(row).find('a[uma-name]').first();
      }

      const umaName = photoLinkForName.attr('uma-name');

      if (umaName) {
        // Parse "No.X　性　父馬：SIRE_NAME　母馬：DAM_NAME" format
        const sireMatch = umaName.match(/父馬：([^　\s]+)/);
        const damMatch = umaName.match(/母馬：([^　\s]+)/);

        if (sireMatch) sireName = sireMatch[1];
        if (damMatch) damName = damMatch[1];
      }

      // Fallback to table cells if uma-name not found
      if (!sireName) sireName = cleanText($(cells[7]).text());
      if (!damName) damName = cleanText($(cells[8]).text());

      // Fix duplicate names (e.g. "SIRE NAME SIRE NAME")
      const fixDuplicate = (name: string) => {
        if (!name) return name;
        const parts = name.split(' ');
        if (parts.length >= 2 && parts.length % 2 === 0) {
          const mid = parts.length / 2;
          const firstHalf = parts.slice(0, mid).join(' ');
          const secondHalf = parts.slice(mid).join(' ');

          const normalize = (s: string) => s.replace(/ウァ/g, 'ヴァ').replace(/ウル/g, 'ヴル').replace(/ウィ/g, 'ヴィ').replace(/ウェ/g, 'ヴェ').replace(/ウォ/g, 'ヴォ').replace(/ルウァ/g, 'ルヴァ').replace(/スワーウ/g, 'スワーヴ');

          if (firstHalf === secondHalf || normalize(firstHalf) === normalize(secondHalf)) {
            return secondHalf;
          }
        }
        return name;
      };

      sireName = fixDuplicate(sireName);
      damName = fixDuplicate(damName);


      const rawSex = cleanText($(cells[4]).text());
      let sex: "牡" | "牝" | "セン" | null = null;
      if (rawSex.includes("牡")) sex = "牡";
      else if (rawSex.includes("牝")) sex = "牝";
      else if (rawSex.includes("セ")) sex = "セン";

      // 画像とPDFのURLをより確実に取得
      const photoCell = $(cells[1]);
      const photoLink = photoCell.find('a[data-lightbox]').attr('href') || photoCell.find('a').attr('href');
      const photoImg = photoCell.find('img').attr('src');

      // 相対パスを絶対URLに変換するためのベースURL
      const baseUrl = catalogUrl.replace(/\/[^\/]*$/, '/');

      // data-titleの中にある実際の画像URLを探す（HBAのLightbox構成に対応）
      let imageUrls: string[] = [];
      const dataTitle = photoCell.find('a[data-lightbox]').attr('data-title');
      if (dataTitle) {
        try {
          const title$ = cheerio.load(dataTitle);
          // 複数の画像を取得
          title$('img').each((_, img) => {
            const imgSrc = title$(img).attr('src');
            if (imgSrc) {
              const cleanedSrc = imgSrc.split('?')[0];
              const absoluteImgSrc = cleanedSrc.startsWith('http') ? cleanedSrc : baseUrl + cleanedSrc;
              imageUrls.push(absoluteImgSrc);
            }
          });
        } catch (e) { }
      }

      // 画像が見つからない場合は従来の方法で取得
      if (imageUrls.length === 0) {
        const rawPhoto = photoImg || photoLink || "";
        const highResPhoto = rawPhoto.split('?')[0];
        if (highResPhoto) {
          const absoluteImgSrc = highResPhoto.startsWith('http') ? highResPhoto : baseUrl + highResPhoto;
          imageUrls.push(absoluteImgSrc);
        }
      }

      const photoUrl = imageUrls.length > 0 ? imageUrls[0] : "";
      const pedigreePdfUrl = ($(cells[0]).find('a').attr('href') || "").split('?')[0];

      // 絶対URLに変換（相対パスの場合）
      const absolutePhotoUrl = photoUrl && !photoUrl.startsWith('http') ? baseUrl + photoUrl : photoUrl;
      const absolutePdfUrl = pedigreePdfUrl && !pedigreePdfUrl.startsWith('http') ? baseUrl + pedigreePdfUrl : pedigreePdfUrl;

      if (lotNumber <= 3) {
        console.log(`[Import Debug] Lot ${lotNumber}: photo=${absolutePhotoUrl}, pdf=${absolutePdfUrl}`);
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
        photoUrl: photoUrl,
        imageUrls: imageUrls, // 複数画像URLを保存
        videoUrl: $(cells[2]).find("a").attr("href") || null,
        pedigreePdfUrl: absolutePdfUrl,
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

    if (!buffer) {
      throw new Error('Failed to fetch PDF: Buffer is empty');
    }

    console.log(`Analyzing PDF content with pdf-parse... (${pdfUrl})`);

    // PDFをパース (純粋なNode.jsライブラリを使用。Vercel等のバイナリ未対応環境でも動作します)
    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (parseError: any) {
      console.error('PDF parse error:', parseError);
      throw new Error(`PDF parsing failed: ${parseError.message}`);
    }

    if (!pdfData || !pdfData.text) {
      console.warn('PDF parsed but no text content found');
      return [];
    }

    const measurements = parseMeasurementText(pdfData.text);

    console.log(`Successfully extracted ${measurements.length} measurements from ${pdfUrl}`);
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

  // 各行から上場番号と測尺データを抽出 (複数カラムに対応)
  // パターン: "  1   156   183   21.0" または "  1   欠場"
  // 正規表現: 
  //   1群: 上場番号（1-4桁）
  //   2群: 「欠場」または「体高 胸囲 管囲」（各数値の間にスペース）
  // グローバル属性(g)を付けて、1行に複数カラムある場合も全て抽出する
  const pattern = /(\d{1,4})\s+(欠場|\d{2,3}\s+\d{2,3}\s+\d{1,2}(?:\.\d+)?)/g;

  for (const line of lines) {
    const matches = Array.from(line.matchAll(pattern));

    for (const match of matches) {
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
        saleId,
        lotNumber: horse.lotNumber,
        sex: horse.sex,
        color: horse.color,
        birthDate: birthDate || null,
        sireName: horse.sireName,
        damName: horse.damName,
        consignor: horse.consignor,
        breeder: horse.breeder,
        height: measurements?.height ? parseFloat(measurements.height.toString()) : null,
        girth: measurements?.girth ? parseFloat(measurements.girth.toString()) : null,
        cannon: measurements?.cannon ? parseFloat(measurements.cannon.toString()) : null,
        priceEstimate: horse.priceEstimate,
        photoUrl: horse.photoUrl,
        imageUrls: horse.imageUrls,
        videoUrl: horse.videoUrl === 'javascript:void(0);' ? null : horse.videoUrl,
        pedigreePdfUrl: horse.pedigreePdfUrl,
        jbisUrl: null, // Explicitly set to null
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
      // Remove horseName property and ensure jbisUrl is null
      const cleanedBatch = batch.map((horse: any) => ({
        saleId: horse.saleId,
        lotNumber: horse.lotNumber,
        sex: horse.sex,
        color: horse.color,
        birthDate: horse.birthDate,
        sireName: horse.sireName,
        damName: horse.damName,
        consignor: horse.consignor,
        breeder: horse.breeder,
        height: horse.height,
        girth: horse.girth,
        cannon: horse.cannon,
        priceEstimate: horse.priceEstimate,
        photoUrl: horse.photoUrl,
        imageUrls: horse.imageUrls,
        videoUrl: horse.videoUrl,
        pedigreePdfUrl: horse.pedigreePdfUrl,
        jbisUrl: null, // Explicitly set to null for catalog import
      }));

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
