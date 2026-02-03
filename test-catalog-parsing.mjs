import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

const catalogUrl = 'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.html';

async function testCatalogParsing() {
  try {
    console.log('Downloading catalog...');
    const response = await fetch(catalogUrl);
    const buffer = await response.arrayBuffer();
    const html = iconv.decode(Buffer.from(buffer), 'Shift_JIS');

    const $ = cheerio.load(html);
    const rows = $('table tr');
    
    console.log(`Total rows: ${rows.length}`);
    
    // 最初の5行を確認
    rows.slice(1, 6).each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');
      
      console.log(`\n=== Row ${index + 1} ===`);
      console.log(`Total cells: ${cells.length}`);
      
      // 最初の15個のセルを表示
      for (let i = 0; i < Math.min(15, cells.length); i++) {
        const text = $(cells[i]).text().trim().substring(0, 50);
        console.log(`Cell[${i}]: ${text}`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCatalogParsing();
