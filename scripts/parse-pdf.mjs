import fetch from 'node-fetch';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createConnection } from 'mysql2/promise';

/**
 * PDF即尺データ抽出スクリプト
 * 日高軽種馬農業協同組合の即尺PDFから馬の体高・胸囲・管囲を抽出
 * 
 * 使用方法:
 *   node parse-pdf.mjs <pdf_url> <sale_id>
 * 
 * 例:
 *   node parse-pdf.mjs "https://w2.hba.or.jp/upload/9bdc1ccda252adae209027c616074690/23ce068eacf834d5f77ec49e71a31725.pdf" 1
 */

const pdfUrl = process.argv[2];
const saleId = parseInt(process.argv[3]) || 1;

if (!pdfUrl) {
  console.error('使用方法: node parse-pdf.mjs <pdf_url> <sale_id>');
  process.exit(1);
}

async function downloadPdf(url) {
  try {
    console.log(`PDFをダウンロード中: ${url}`);
    const response = await fetch(url);
    const buffer = await response.buffer();
    
    const tempDir = '/tmp';
    const filename = `seri_${Date.now()}.pdf`;
    const filepath = path.join(tempDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    console.log(`PDFを保存しました: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error('PDFダウンロードエラー:', error.message);
    throw error;
  }
}

async function extractPdfText(pdfPath) {
  try {
    console.log('PDFからテキストを抽出中...');
    
    // pdftotext コマンドを使用してテキスト抽出
    const output = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8' });
    
    return output;
  } catch (error) {
    console.error('PDF抽出エラー:', error.message);
    throw error;
  }
}

function parseJokushaData(text) {
  /**
   * 即尺データの解析
   * 一般的な即尺表の形式:
   * 上場番号 | 馬名 | 体高(cm) | 胸囲(cm) | 管囲(cm)
   * 
   * または
   * 
   * 上場番号 馬名 体高 胸囲 管囲
   */
  
  const horses = [];
  const lines = text.split('\n');
  
  // 正規表現パターン
  // 上場番号（1-3桁） 馬名 体高（3桁） 胸囲（3桁） 管囲（2-3桁）
  const pattern = /^(\d{1,3})\s+([^\d\s]+)\s+(\d{3})\s+(\d{3})\s+(\d{2,3})$/gm;
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    horses.push({
      lotNumber: parseInt(match[1]),
      horseName: match[2].trim(),
      height: parseInt(match[3]),      // 体高(cm)
      girth: parseInt(match[4]),        // 胸囲(cm)
      cannon: parseInt(match[5]),       // 管囲(cm)
    });
  }
  
  // パターンマッチングがない場合、行ごとに解析を試みる
  if (horses.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 数値が含まれている行をフィルタ
      if (/\d/.test(trimmed) && trimmed.length > 5) {
        // 複数の数値を抽出
        const numbers = trimmed.match(/\d+/g) || [];
        
        if (numbers.length >= 4) {
          // 最初の数値が上場番号、次が体高、胸囲、管囲と仮定
          const lotNumber = parseInt(numbers[0]);
          const height = parseInt(numbers[numbers.length - 3]);
          const girth = parseInt(numbers[numbers.length - 2]);
          const cannon = parseInt(numbers[numbers.length - 1]);
          
          // 妥当性チェック
          if (lotNumber > 0 && lotNumber < 1000 &&
              height > 100 && height < 200 &&
              girth > 100 && girth < 300 &&
              cannon > 15 && cannon < 50) {
            
            // 馬名を抽出（数値以外の部分）
            const horseName = trimmed.replace(/\d+/g, '').trim().split(/\s+/)[0];
            
            if (horseName && horseName.length > 0) {
              horses.push({
                lotNumber,
                horseName,
                height,
                girth,
                cannon,
              });
            }
          }
        }
      }
    }
  }
  
  return horses;
}

async function updateHorsesWithJokushaData(horses, saleId) {
  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'seri_viewer',
  });

  try {
    for (const horse of horses) {
      const query = `
        UPDATE horses
        SET height = ?, girth = ?, cannon = ?
        WHERE saleId = ? AND lotNumber = ?
      `;

      const result = await connection.execute(query, [
        horse.height,
        horse.girth,
        horse.cannon,
        saleId,
        horse.lotNumber,
      ]);

      if (result[0].affectedRows === 0) {
        console.warn(`警告: 上場番号 ${horse.lotNumber} の馬が見つかりません`);
      }
    }

    console.log(`${horses.length}件の即尺データを更新しました`);
  } finally {
    await connection.end();
  }
}

async function main() {
  let pdfPath = null;
  
  try {
    console.log(`PDF即尺データ抽出を開始します...`);
    console.log(`URL: ${pdfUrl}`);
    console.log(`セリID: ${saleId}`);
    
    // PDFをダウンロード
    pdfPath = await downloadPdf(pdfUrl);
    
    // PDFからテキストを抽出
    const text = await extractPdfText(pdfPath);
    
    // 即尺データを解析
    const horses = parseJokushaData(text);
    
    if (horses.length === 0) {
      console.warn('警告: PDFから即尺データが抽出されませんでした');
      console.log('PDFの形式を確認し、パターンを調整してください');
      process.exit(1);
    }

    console.log(`${horses.length}件の即尺データを抽出しました`);
    console.log('最初の3件のサンプル:');
    horses.slice(0, 3).forEach(h => {
      console.log(`  - ${h.lotNumber}: ${h.horseName} (体高: ${h.height}cm, 胸囲: ${h.girth}cm, 管囲: ${h.cannon}cm)`);
    });

    // データベースに保存（オプション）
    if (process.env.SAVE_TO_DB === 'true') {
      await updateHorsesWithJokushaData(horses, saleId);
    } else {
      console.log('\n保存するには SAVE_TO_DB=true を設定してください');
    }
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  } finally {
    // 一時ファイルを削除
    if (pdfPath && fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('一時ファイルを削除しました');
    }
  }
}

main();
