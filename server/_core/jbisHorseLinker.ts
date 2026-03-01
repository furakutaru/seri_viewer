import { getDb } from '../db';
import { horses } from '../../drizzle/schema';
import { JbisHorseData } from './jbisScraper';
import { sql, eq } from 'drizzle-orm';

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
          // 馬名で既存の馬を検索
          const existingHorses = await db.select()
            .from(horses)
            .where(eq(horses.sireName, horse.horseName))
            .limit(10);

          if (existingHorses.length === 0) {
            result.notFound++;
            console.log(`[JbisLinker] Horse not found: ${horse.horseName}`);
            continue;
          }

          // 該当する馬を更新（複数いる場合も対応）
          for (const existingHorse of existingHorses) {
            await db.update(horses)
              .set({ jbisUrl: horse.horseUrl, updatedAt: new Date() })
              .where(eq(horses.id, existingHorse.id));
            
            result.updated++;
            console.log(`[JbisLinker] Updated horse: ${horse.horseName} -> ${horse.horseUrl}`);
          }

          // 父のURLを更新
          if (horse.sireName && horse.sireUrl) {
            const sireUpdateResult = await db.update(horses)
              .set({ jbisUrl: horse.sireUrl, updatedAt: new Date() })
              .where(eq(horses.sireName, horse.sireName))
              .returning({ id: horses.id });

            if (sireUpdateResult.length > 0) {
              result.sireUpdated += sireUpdateResult.length;
              console.log(`[JbisLinker] Updated sire: ${horse.sireName} -> ${horse.sireUrl}`);
            }
          }

          // 母のURLを更新
          if (horse.damName && horse.damUrl) {
            const damUpdateResult = await db.update(horses)
              .set({ jbisUrl: horse.damUrl, updatedAt: new Date() })
              .where(eq(horses.damName, horse.damName))
              .returning({ id: horses.id });

            if (damUpdateResult.length > 0) {
              result.damUpdated += damUpdateResult.length;
              console.log(`[JbisLinker] Updated dam: ${horse.damName} -> ${horse.damUrl}`);
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
