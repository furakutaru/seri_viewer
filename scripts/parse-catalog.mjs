import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createConnection } from 'mysql2/promise';

/**
 * Webカタログ解析スクリプト
 * 日高軽種馬農業協同組合のセリ市カタログHTMLを解析し、馬データを抽出
 * 
 * 使用方法:
 *   node parse-catalog.mjs <catalog_url> <sale_id>
 * 
 * 例:
 *   node parse-catalog.mjs "https://wmp512t973.user-space.cdn.idcfcloud.net/catalog/20250801/index250818.html" 1
 */

const catalogUrl = process.argv[2];
const saleId = parseInt(process.argv[3]) || 1;

if (!catalogUrl) {
  console.error('使用方法: node parse-catalog.mjs <catalog_url> <sale_id>');
  process.exit(1);
}

async function parseHtmlCatalog(url) {
  try {
    console.log(`カタログをダウンロード中: ${url}`);
    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);
    const horses = [];

    // 馬データを含むテーブルまたはセクションを探す
    // 日高軽種馬農業協同組合のカタログ構造に合わせて調整
    $('tr, .horse-item, [data-horse-id]').each((index, element) => {
      const $elem = $(element);
      
      // 上場番号
      const lotNumber = $elem.find('td:nth-child(1), .lot-number, [data-lot]').text().trim();
      
      // 馬名
      const horseName = $elem.find('td:nth-child(2), .horse-name, [data-name]').text().trim();
      
      // 性別
      const sex = $elem.find('td:nth-child(3), .sex, [data-sex]').text().trim();
      
      // 毛色
      const color = $elem.find('td:nth-child(4), .color, [data-color]').text().trim();
      
      // 生年月日
      const birthDate = $elem.find('td:nth-child(5), .birth-date, [data-birth]').text().trim();
      
      // 父馬名
      const sireName = $elem.find('td:nth-child(6), .sire-name, [data-sire]').text().trim();
      
      // 母馬名
      const damName = $elem.find('td:nth-child(7), .dam-name, [data-dam]').text().trim();
      
      // 上場者（飼養者）
      const consignor = $elem.find('td:nth-child(8), .consignor, [data-consignor]').text().trim();
      
      // 生産者
      const breeder = $elem.find('td:nth-child(9), .breeder, [data-breeder]').text().trim();
      
      // 販売希望価格
      const priceEstimate = $elem.find('td:nth-child(10), .price, [data-price]').text().trim();
      
      // 写真URL（相対パスの場合は絶対パスに変換）
      let photoUrl = $elem.find('img, .photo img').attr('src') || '';
      if (photoUrl && !photoUrl.startsWith('http')) {
        const baseUrl = new URL(url);
        photoUrl = new URL(photoUrl, baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/'))).href;
      }
      
      // 動画URL
      const videoUrl = $elem.find('a[href*=".mp4"], .video a').attr('href') || '';
      
      if (lotNumber && horseName) {
        horses.push({
          saleId,
          lotNumber: parseInt(lotNumber) || 0,
          horseName,
          sex: sex || '不明',
          color: color || '不明',
          birthDate: birthDate ? new Date(birthDate) : null,
          sireName: sireName || '不明',
          damName: damName || '不明',
          consignor: consignor || '不明',
          breeder: breeder || '不明',
          priceEstimate: priceEstimate ? parseInt(priceEstimate.replace(/[^\d]/g, '')) : null,
          photoUrl: photoUrl || null,
          videoUrl: videoUrl || null,
          pedigreePdfUrl: null, // PDFスクリプトで後から設定
        });
      }
    });

    return horses;
  } catch (error) {
    console.error('カタログ解析エラー:', error.message);
    throw error;
  }
}

async function saveHorsesToDatabase(horses) {
  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'seri_viewer',
  });

  try {
    for (const horse of horses) {
      const query = `
        INSERT INTO horses (
          saleId, lotNumber, horseName, sex, color, birthDate,
          sireName, damName, consignor, breeder, priceEstimate,
          photoUrl, videoUrl, pedigreePdfUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          horseName = VALUES(horseName),
          sex = VALUES(sex),
          color = VALUES(color),
          birthDate = VALUES(birthDate),
          sireName = VALUES(sireName),
          damName = VALUES(damName),
          consignor = VALUES(consignor),
          breeder = VALUES(breeder),
          priceEstimate = VALUES(priceEstimate),
          photoUrl = VALUES(photoUrl),
          videoUrl = VALUES(videoUrl),
          pedigreePdfUrl = VALUES(pedigreePdfUrl)
      `;

      await connection.execute(query, [
        horse.saleId,
        horse.lotNumber,
        horse.horseName,
        horse.sex,
        horse.color,
        horse.birthDate,
        horse.sireName,
        horse.damName,
        horse.consignor,
        horse.breeder,
        horse.priceEstimate,
        horse.photoUrl,
        horse.videoUrl,
        horse.pedigreePdfUrl,
      ]);
    }

    console.log(`${horses.length}件の馬データをデータベースに保存しました`);
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    console.log(`Webカタログ解析を開始します...`);
    console.log(`URL: ${catalogUrl}`);
    console.log(`セリID: ${saleId}`);
    
    const horses = await parseHtmlCatalog(catalogUrl);
    
    if (horses.length === 0) {
      console.warn('警告: カタログから馬データが抽出されませんでした');
      console.log('HTMLの構造を確認し、セレクターを調整してください');
      process.exit(1);
    }

    console.log(`${horses.length}件の馬データを抽出しました`);
    console.log('最初の3件のサンプル:');
    horses.slice(0, 3).forEach(h => {
      console.log(`  - ${h.lotNumber}: ${h.horseName} (${h.sex}, ${h.color})`);
    });

    // データベースに保存（オプション）
    if (process.env.SAVE_TO_DB === 'true') {
      await saveHorsesToDatabase(horses);
    } else {
      console.log('\n保存するには SAVE_TO_DB=true を設定してください');
    }
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
}

main();
