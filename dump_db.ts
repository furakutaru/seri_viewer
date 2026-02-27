import * as dotenv from 'dotenv';
dotenv.config();
import { getDb } from './server/db';
import { sales, horses } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const db = await getDb();
    if (!db) {
        console.error('DB not available');
        return;
    }

    const allSales = await db.select().from(sales);
    console.log('--- Sales ---');
    console.log(JSON.stringify(allSales, null, 2));

    const allHorses = await db.select().from(horses).limit(5);
    console.log('--- Horses (first 5) ---');
    console.log(JSON.stringify(allHorses, null, 2));
}

main().catch(console.error);
