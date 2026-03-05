import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs';
import path from 'path';

const cacheDir = '.cache';
const pdfFiles = fs.readdirSync(cacheDir).filter(f => f.endsWith('.pdf'));

console.log('=== PDFファイル解析調査 ===');
console.log('発見されたPDFファイル数:', pdfFiles.length);

async function analyzePdf(pdfFile) {
  const pdfPath = path.join(cacheDir, pdfFile);
  console.log('\n--- 分析:', pdfFile, '---');
  
  try {
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(buffer);
    
    console.log('ページ数:', data.numpages);
    console.log('テキスト長:', data.text ? data.text.length : 0);
    
    // 上場番号のパターンで検索
    const lotPattern = /(\d{1,4})\s*(欠場|(1\d{2})\s*(\d{3})\s*(\d{2}(?:\.\d)?))/g;
    const matches = Array.from(data.text.matchAll(lotPattern));
    console.log('検出された測尺データ数:', matches.length);
    
    if (matches.length > 0) {
      console.log('最初の5件:', matches.slice(0, 5).map(m => m[1]));
    }
    
    // ページ区切りを探す
    const pageBreaks = (data.text.match(/\f/g) || []).length;
    console.log('ページ区切り文字数:', pageBreaks);
    
    // テキストの最初と最後を表示
    console.log('テキスト最初200文字:', data.text.substring(0, 200));
    console.log('テキスト最後200文字:', data.text.substring(data.text.length - 200));
    
    return { numpages: data.numpages, matches: matches.length, textLength: data.text.length };
  } catch (err) {
    console.error('解析エラー:', err.message);
    return null;
  }
}

async function main() {
  const results = [];
  for (const pdfFile of pdfFiles.slice(0, 3)) {
    const result = await analyzePdf(pdfFile);
    if (result) {
      results.push({ file: pdfFile, ...result });
    }
  }
  
  console.log('\n=== まとめ ===');
  results.forEach(r => {
    console.log(`${r.file}: ${r.numpages}ページ, ${r.matches}件のデータ, テキスト長=${r.textLength}`);
  });
}

main().catch(console.error);
