import { jbisScraperService, JbisHorseData } from './jbisScraper';
import { jbisHorseLinkerService } from './jbisHorseLinker';
import { getPedigreeUrl, savePedigreeUrl } from '../db';

export class JbisImportService {
  async importFromSaleUrl(saleUrl: string): Promise<{ success: number; skipped: number; errors: string[] }> {
    console.log(`[JbisImport] Starting import from: ${saleUrl}`);
    
    const result = {
      success: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      // スクレイピング実行
      const horseData = await jbisScraperService.scrapeSalePage(saleUrl);
      
      if (horseData.length === 0) {
        result.errors.push('No horse data found');
        return result;
      }

      // 既存の馬にJBIS URLを紐付け
      const linkResult = await jbisHorseLinkerService.linkJbisUrlsToHorses(horseData);
      
      result.success = linkResult.updated + linkResult.sireUpdated + linkResult.damUpdated;
      result.errors.push(...linkResult.errors);
      
      console.log(`[JbisImport] Completed: ${result.success} URLs linked, ${result.errors.length} errors`);
      return result;

    } catch (error) {
      const errorMsg = `Failed to scrape ${saleUrl}: ${error}`;
      console.error(`[JbisImport] ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }

  // 複数のセールURLを一括処理
  async importFromMultipleUrls(saleUrls: string[]): Promise<{ total: { success: number; skipped: number; errors: string[] }; results: any[] }> {
    const total = {
      success: 0,
      skipped: 0,
      errors: [] as string[]
    };
    const results = [];

    for (const url of saleUrls) {
      console.log(`\n[JbisImport] Processing: ${url}`);
      const result = await this.importFromSaleUrl(url);
      
      total.success += result.success;
      total.skipped += result.skipped;
      total.errors.push(...result.errors);
      
      results.push({
        url,
        ...result
      });

      // レート制限対策（各URL間に2秒待機）
      if (saleUrls.indexOf(url) < saleUrls.length - 1) {
        console.log('[JbisImport] Waiting 2 seconds before next URL...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n[JbisImport] All completed: ${total.success} total saved, ${total.skipped} total skipped, ${total.errors.length} total errors`);
    return { total, results };
  }
}

export const jbisImportService = new JbisImportService();
