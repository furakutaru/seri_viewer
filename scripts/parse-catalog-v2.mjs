import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

/**
 * Webカタログ（HTML）から馬データを抽出する改善版スクリプト
 * Shift_JIS エンコーディングに対応
 */
export async function parseCatalogV2(catalogUrl) {
  try {
    console.log(`Fetching catalog from: ${catalogUrl}`);
    
    const response = await fetch(catalogUrl);
    const buffer = await response.buffer();
    
    // Shift_JISをUTF-8に変換
    const htmlString = iconv.decode(buffer, 'shift_jis');
    
    const $ = cheerio.load(htmlString);
    
    const horses = [];
    
    // sortTableからテーブル行を抽出
    const rows = $('#sortTable tbody tr');
    
    console.log(`Found ${rows.length} rows in table`);
    
    rows.each((index, element) => {
      const cells = $(element).find('td');
      
      if (cells.length < 10) return; // ヘッダー行やデータ不足の行をスキップ
      
      try {
        const lotNumber = $(cells[0]).text().trim();
        const sex = $(cells[4]).text().trim();
        const color = $(cells[5]).text().trim();
        const birthDate = $(cells[6]).text().trim();
        const sireName = $(cells[7]).text().trim();
        const damName = $(cells[8]).text().trim();
        const breeder = $(cells[9]).text().trim();
        
        // 写真URL抽出
        const photoLink = $(cells[1]).find('a');
        const photoUrl = photoLink.length > 0 ? photoLink.attr('href') : null;
        
        // 馬名抽出（複数の場所にある可能性）
        let horseName = '';
        if (cells.length > 3) {
          horseName = $(cells[3]).text().trim();
        }
        
        if (lotNumber && horseName) {
          horses.push({
            lotNumber: parseInt(lotNumber),
            horseName,
            sex,
            color,
            birthDate,
            sireName,
            damName,
            breeder,
            photoUrl,
          });
        }
      } catch (err) {
        console.warn(`Error parsing row ${index}:`, err.message);
      }
    });
    
    console.log(`Successfully extracted ${horses.length} horses`);
    return horses;
  } catch (error) {
    console.error('Error parsing catalog:', error);
    throw error;
  }
}

// テスト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const catalogUrl = process.argv[2] || 'https://wmp512t973.user-space.cdn.idcfcloud.net/catalog/20250801/index250818.html';
  
  try {
    const horses = await parseCatalogV2(catalogUrl);
    console.log('\nFirst 5 horses:');
    console.log(JSON.stringify(horses.slice(0, 5), null, 2));
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}
