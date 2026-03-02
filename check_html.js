import 'dotenv/config';
import { fetchAndCacheHtml } from './server/import-data.js';

async function checkHtml() {
  try {
    const html = await fetchAndCacheHtml('https://www.jbis.or.jp/horse/0000000004/');
    
    console.log('--- HTML Content Check ---');
    console.log('Contains ヴ:', html.includes('ヴ'));
    console.log('Contains ウ:', html.includes('ウ'));
    console.log('Contains ゴ:', html.includes('ゴ'));
    console.log('Contains ホ:', html.includes('ホ'));
    
    // 馬名関連の部分を抽出
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      console.log('Title:', titleMatch[1]);
    }
    
    // 馬名が含まれそうな部分を検索
    const namePatterns = [
      /馬名[：:]\s*([^<\s]+)/g,
      /horseName[：:]\s*([^<\s]+)/g,
      /ヴ[^<]*ゴ/g,
      /ウ[^<]*ゴ/g
    ];
    
    console.log('\n--- Name Pattern Search ---');
    for (const pattern of namePatterns    for (const pattern of namePatterns    for (const pf (matches    for (const pattelog(    for (const pattern of namePatterns    for (const pattnsole    for (const pattern );
      }
                                                                                       ---');
                                              
                                              
       message);
  }
}

checkHtml();
