import { getDb } from '../db';
import { horses } from '../../drizzle/schema';
import { JbisHorseData } from './jbisScraper';
import { sql, eq } from 'drizzle-orm';

// 馬名を正規化する関数（国表記などを除去）
function normalizeHorseName(name: string): string {
  if (!name) return '';
  return name
    .replace(/[（(][^）)]*[）)]$/g, '')  // 末尾の（...）を除去
    .replace(/\s+/g, '')                 // 空白を除去
    .trim();
}

export class JbisHorseLinkerService {
  async linkJbisUrlsToHorses(horseData: JbisHorseData[]): Promise<{ 
    updated: number; 
    notFound: number; 
    sireUpdated: number; 
    damUpdated: number; 
    errors: string[] 
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    const result = {
      updated: 0,
      notFound: 0,
      sireUpdated: 0,
      damUpdated: 0,
      errors: [] as string[]
    };

    try {
      // 各馬のデータを処理
      for (const horse of horseData) {
        try {
          // 上場番号で既存の馬を検索
          const lotNumber = parseInt(horse.horseName);
          if (isNaN(lotNumber)) {
            result.notFound++;
            console.log(`[JbisLinker] Invalid lot number: ${horse.horseName}`);
            continue;
          }

          const existingHorses = await db.select()
            .from(horses)
            .where(eq(horses.lotNumber, lotNumber))
            .limit(10);

          if (existingHorses.length === 0) {
            result.notFound++;
            console.log(`[JbisLinker] Horse not found: ${horse.horseName}`);
            continue;
          }

          // 該当する馬を更新（複数いる場合も対応）
          for (const existingHorse of existingHorses) {
            await db.update(horses)
              .set({ 
                jbisUrl: horse.horseUrl, 
                sireUrl: horse.sireUrl,
                damUrl: horse.damUrl,
                updatedAt: new Date() 
              })
              .where(eq(horses.id, existingHorse.id));
            
            result.updated++;
            console.log(`[JbisLinker] Updated horse: ${horse.horseName} -> ${horse.horseUrl}`);
            console.log(`[JbisLinker]   Sire: ${horse.sireName} -> ${horse.sireUrl}`);
            console.log(`[JbisLinker]   Dam: ${horse.damName} -> ${horse.damUrl}`);
          }

          // 父のURLを他の馬にも設定（馬名クリーニングで突き合わせ）
          if (horse.sireName && horse.sireUrl) {
            const normalizedSireName = normalizeHorseName(horse.sireName);
            const sireUpdateResult = await db.update(horses)
              .set({ sireUrl: horse.sireUrl, updatedAt: new Date() })
              .where(sql`REGEXP_REPLACE(REGEXP_REPLACE(${horses.sireName}, '[（(][^）)]*[）)]$', ''), '\s+', '') = ${normalizedSireName}`)
              .returning({ id: horses.id });

            if (sireUpdateResult.length > 0) {
              result.sireUpdated += sireUpdateResult.length;
              console.log(`[JbisLinker] Updated ${sireUpdateResult.length} sires with name: ${horse.sireName} (${normalizedSireName}) -> ${horse.sireUrl}`);
            }
          }

          // 母のURLを他の馬にも設定（馬名クリーニングで突き合わせ）
          if (horse.damName && horse.damUrl) {
            const normalizedDamName = normalizeHorseName(horse.damName);
            const damUpdateResult = await db.update(horses)
              .set({ damUrl: horse.damUrl, updatedAt: new Date() })
              .where(sql`REGEXP_REPLACE(REGEXP_REPLACE(${horses.damName}, '[（(][^）)]*[）)]$', ''), '\s+', '') = ${normalizedDamName}`)
              .returning({ id: horses.id });

            if (damUpdateResult.length > 0) {
              result.damUpdated += damUpdateResult.length;
              console.log(`[JbisLinker] Updated ${damUpdateResult.length} dams with name: ${horse.damName} (${normalizedDamName}) -> ${horse.damUrl}`);
            }
          }

        } catch (error) {
          const errorMsg = `Error processing ${horse.horseName}: ${error}`;
          console.error(`[JbisLinker] ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }

      console.log(`[JbisLinker] Completed: ${result.updated} horses updated, ${result.sireUpdated} sires updated, ${result.damUpdated} dams updated, ${result.notFound} not found, ${result.errors.length} errors`);

      return result;

    } catch (error) {
      console.error('[JbisLinker] Database error:', error);
      throw error;
    }
  }

  // 高速バッチ処理でJBIS URLを紐付け（Serverless対応）
  async linkJbisUrlsToHorsesBatch(horseData: JbisHorseData[], batchSize: number = 30, startFrom: number = 1): Promise<{ 
    totalProcessed: number; 
    batches: Array<{ batchNumber: number; processed: number; updated: number; notFound: number; errors: string[] }>;
    summary: { updated: number; notFound: number; sireUpdated: number; damUpdated: number; errors: string[] }
  }> {
    const totalBatches = Math.ceil(horseData.length / batchSize);
    const results = [];
    let summary = { updated: 0, notFound: 0, sireUpdated: 0, damUpdated: 0, errors: [] as string[] };

    console.log(`[JbisLinker] Starting optimized batch processing: ${horseData.length} horses, ${totalBatches} batches (${batchSize} per batch)`);

    for (let i = 0; i < totalBatches; i++) {
      const batchStart = i * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, horseData.length);
      const batchData = horseData.slice(batchStart, batchEnd);
      const batchNumber = startFrom + i;

      console.log(`[JbisLinker] Processing batch ${batchNumber}/${totalBatches + startFrom - 1} (${batchData.length} horses)`);

      try {
        const batchResult = await this.linkJbisUrlsToHorses(batchData);
        
        results.push({
          batchNumber,
          processed: batchData.length,
          updated: batchResult.updated,
          notFound: batchResult.notFound,
          errors: batchResult.errors
        });
        
        summary.updated += batchResult.updated;
        summary.notFound += batchResult.notFound;
        summary.sireUpdated += batchResult.sireUpdated;
        summary.damUpdated += batchResult.damUpdated;
        summary.errors.push(...batchResult.errors);
        
        console.log(`[JbisLinker] Completed batch ${batchNumber}: ${batchResult.updated} updated, ${batchResult.notFound} not found`);
        
        // 進捗を5バッチごとに報告
        if ((batchNumber - startFrom + 1) % 5 === 0 || batchNumber === totalBatches + startFrom - 1) {
          const progress = Math.round(((batchNumber - startFrom + 1) / totalBatches) * 100);
          console.log(`[JbisLinker] Progress: ${progress}% (${summary.updated} total updates)`);
        }
        
      } catch (error) {
        const errorMsg = `Batch ${batchNumber} failed: ${error}`;
        console.error(`[JbisLinker] ${errorMsg}`);
        results.push({
          batchNumber,
          processed: batchData.length,
          updated: 0,
          notFound: batchData.length,
          errors: [errorMsg]
        });
        summary.errors.push(errorMsg);
        summary.notFound += batchData.length;
      }
    }

    console.log(`[JbisLinker] Batch processing completed: ${summary.updated} updated, ${summary.notFound} not found, ${summary.errors.length} errors`);
    return { totalProcessed: horseData.length, batches: results, summary };
  }

  // 既存の馬にJBIS URLがあるかチェック
  async checkExistingJbisUrls(): Promise<{ total: number; withJbisUrl: number; withoutJbisUrl: number }> {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    try {
      const totalResult = await db.select({ count: sql<number>`count(*)::int` }).from(horses);
      const withJbisUrlResult = await db.select({ count: sql<number>`count(*)::int` })
        .from(horses)
        .where(sql`${horses.jbisUrl} IS NOT NULL AND ${horses.jbisUrl} != ''`);
      
      const total = totalResult[0]?.count || 0;
      const withJbisUrl = withJbisUrlResult[0]?.count || 0;
      const withoutJbisUrl = total - withJbisUrl;

      return { total, withJbisUrl, withoutJbisUrl };
    } catch (error) {
      console.error('[JbisLinker] Error checking existing URLs:', error);
      throw error;
    }
  }
}

export const jbisHorseLinkerService = new JbisHorseLinkerService();
