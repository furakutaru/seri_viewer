import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

/**
 * Webカタログ（HTML）から馬データを抽出する最終版スクリプト
 * 実データ構造に対応
 */
export async function parseCatalogV3(catalogUrl) {
  try {
    console.log(`Fetching catalog from: ${catalogUrl}`);
    
    const response = await fetch(catalogUrl);
    const buffer = await response.arrayBuffer();
    
    // Shift_JISをUTF-8に変換
    const htmlString = iconv.decode(Buffer.from(buffer), 'shift_jis');
    
    const $ = cheerio.load(htmlString);
    
    const horses = [];
    
    // sortTableからテーブル行を抽出
    const rows = $('#sortTable tbody tr');
    
    console.log(`Found ${rows.length} rows in table`);
    
    rows.each((index, element) => {
      const cells = $(element).find('td');
      
      // 最低限のセル数をチェック（15セルが目安）
      if (cells.length < 10) return;
      
      try {
        // TD 0: 上場番号
        const lotNumber = $(cells[0]).text().trim();
        
        // TD 4: 性別
        const sex = $(cells[4]).text().trim();
        
        // TD 5: 毛色
        const color = $(cells[5]).text().trim();
        
        // TD 6: 生年月日
        const birthDate = $(cells[6]).text().trim();
        
        // TD 7: 父馬名
        const sireName = $(cells[7]).text().trim();
        
        // TD 8: 母馬名
        const damName = $(cells[8]).text().trim();
        
        // TD 9: 生産者（牧場）
        const breeder = $(cells[9]).text().trim();
        
        // TD 10: 上場者
        const consignor = cells.length > 10 ? $(cells[10]).text().trim() : '';
        
        // TD 14: 販売希望価格
        const priceEstimate = cells.length > 14 ? $(cells[14]).text().trim() : '';
        
        // 写真URL抽出（TD 1から）
        const photoLink = $(cells[1]).find('a[data-lightbox]');
        const photoUrl = photoLink.length > 0 ? photoLink.attr('href') : null;
        
        // 馬名抽出（data-titleまたはuma-nameから）
        let horseName = '';
        const photoAttr = photoLink.attr('uma-name');
        if (photoAttr) {
          // "No.1　牡　父馬：コパノリッキー　母馬：サイモンベラーノ" 形式から抽出
          const match = photoAttr.match(/^No\.(\d+)/);
          if (match) {
            horseName = `No.${match[1]}`;
          }
        }
        
        if (lotNumber && sex && color) {
          horses.push({
            lotNumber: parseInt(lotNumber),
            horseName: horseName || `No.${lotNumber}`,
            sex,
            color,
            birthDate,
            sireName,
            damName,
            breeder,
            consignor,
            priceEstimate,
            photoUrl: photoUrl ? new URL(photoUrl, catalogUrl).href : null,
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
    const horses = await parseCatalogV3(catalogUrl);
    console.log('\nFirst 5 horses:');
    console.log(JSON.stringify(horses.slice(0, 5), null, 2));
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}
