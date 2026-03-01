import { ENV } from './env';
import fs from 'fs';
import path from 'path';

export interface JbisHorseData {
  horseName: string;
  horseUrl: string;
  sireName: string;
  sireUrl: string;
  damName: string;
  damUrl: string;
}

interface CacheData {
  url: string;
  data: JbisHorseData[];
  timestamp: number;
}

export class JbisScraperService {
  private cacheDir: string;
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24時間

  constructor() {
    this.cacheDir = path.join(process.cwd(), '.cache', 'jbis');
    this.ensureCacheDir();
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getCacheKey(url: string): string {
    return Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  }

  private getCachePath(url: string): string {
    return path.join(this.cacheDir, `${this.getCacheKey(url)}.json`);
  }

  private loadFromCache(url: string): JbisHorseData[] | null {
    try {
      const cachePath = this.getCachePath(url);
      if (!fs.existsSync(cachePath)) {
        return null;
      }

      const cacheData: CacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      
      // キャッシュの有効期限チェック
      if (Date.now() - cacheData.timestamp > this.cacheExpiry) {
        fs.unlinkSync(cachePath);
        return null;
      }

      console.log(`[JbisScraper] Loaded from cache: ${url}`);
      return cacheData.data;
    } catch (error) {
      console.warn('[JbisScraper] Cache load error:', error);
      return null;
    }
  }

  private saveToCache(url: string, data: JbisHorseData[]): void {
    try {
      const cachePath = this.getCachePath(url);
      const cacheData: CacheData = {
        url,
        data,
        timestamp: Date.now()
      };
      
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
      console.log(`[JbisScraper] Saved to cache: ${url}`);
    } catch (error) {
      console.warn('[JbisScraper] Cache save error:', error);
    }
  }

  async scrapeSalePage(saleUrl: string): Promise<JbisHorseData[]> {
    console.log(`[JbisScraper] Scraping: ${saleUrl}`);

    // キャッシュチェック
    const cachedData = this.loadFromCache(saleUrl);
    if (cachedData) {
      return cachedData;
    }

    try {
      // ページ取得
      const response = await fetch(saleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // HTML解析
      const horseData = this.parseHorseData(html);
      
      // キャッシュ保存
      this.saveToCache(saleUrl, horseData);
      
      console.log(`[JbisScraper] Found ${horseData.length} horses`);
      return horseData;
      
    } catch (error) {
      console.error(`[JbisScraper] Error scraping ${saleUrl}:`, error);
      throw error;
    }
  }

  private parseHorseData(html: string): JbisHorseData[] {
    const horseData: JbisHorseData[] = [];
    
    // 馬のブロックを抽出（番号リンクを含むdivブロック）
    const horseBlocks = html.match(/<div>\s*<div>\s*<a href="\/horse\/\d+\/"[^>]*>\d+<\/a>[\s\S]*?<\/div>\s*<\/div>/g);
    
    if (!horseBlocks) {
      console.log('[JbisScraper] No horse blocks found');
      return horseData;
    }
    
    console.log(`[JbisScraper] Found ${horseBlocks.length} horse blocks`);
    
    // 各ブロックから馬情報を抽出
    for (const block of horseBlocks) {
      // ブロック内のすべての馬リンクを抽出
      const allLinks = block.match(/<a href="\/horse\/(\d+)\/"[^>]*class="txt-link">([^<]+)<\/a>/g);
      
      if (!allLinks || allLinks.length < 3) {
        console.log('[JbisScraper] Insufficient links in block, skipping');
        continue;
      }
      
      // 最初の3つを馬名、父名、母名として使用
      const horseMatch = allLinks[0]?.match(/<a href="\/horse\/(\d+)\/"[^>]*class="txt-link">([^<]+)<\/a>/);
      const sireMatch = allLinks[1]?.match(/<a href="\/horse\/(\d+)\/"[^>]*class="txt-link">([^<]+)<\/a>/);
      const damMatch = allLinks[2]?.match(/<a href="\/horse\/(\d+)\/"[^>]*class="txt-link">([^<]+)<\/a>/);
      
      if (horseMatch && sireMatch && damMatch) {
        const [, horseId, horseName] = horseMatch;
        const [, sireId, sireName] = sireMatch;
        const [, damId, damName] = damMatch;
        
        const cleanHorseName = horseName.replace(/\s+/g, '').trim();
        const cleanSireName = sireName.replace(/\s+/g, '').trim();
        const cleanDamName = damName.replace(/\s+/g, '').trim();
        
        horseData.push({
          horseName: cleanHorseName,
          horseUrl: `https://www.jbis.or.jp/horse/${horseId}/`,
          sireName: cleanSireName,
          sireUrl: `https://www.jbis.or.jp/horse/${sireId}/`,
          damName: cleanDamName,
          damUrl: `https://www.jbis.or.jp/horse/${damId}/`
        });
      }
    }
    
    console.log(`[JbisScraper] Processed ${horseData.length} horses`);
    
    // デバッグ用：最初の数件を表示
    if (horseData.length > 0) {
      console.log('[JbisScraper] First few matches:');
      horseData.slice(0, 3).forEach((horse, index) => {
        console.log(`  ${index + 1}. ${horse.horseName} (${horse.horseUrl})`);
      });
    }
    
    return horseData;
  }

  // キャッシュクリア
  clearCache(): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        fs.unlinkSync(filePath);
      });
      console.log('[JbisScraper] Cache cleared');
    } catch (error) {
      console.warn('[JbisScraper] Cache clear error:', error);
    }
  }

  // キャッシュ情報取得
  getCacheInfo(): { count: number; size: number } {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let totalSize = 0;
      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });
      
      return {
        count: files.length,
        size: totalSize
      };
    } catch (error) {
      return { count: 0, size: 0 };
    }
  }
}

export const jbisScraperService = new JbisScraperService();
