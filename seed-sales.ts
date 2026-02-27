import "dotenv/config";
import { sales, users } from "./drizzle/schema";
import { getDb } from "./server/db";

async function seed() {
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed");
        process.exit(1);
    }

    console.log("Seeding data...");

    try {
        // Insert admin user for local development bypass
        const ownerOpenId = process.env.OWNER_OPEN_ID || "admin";
        await db.insert(users).values({
            openId: ownerOpenId,
            name: "Local Admin",
            role: "admin",
        }).onConflictDoNothing();
        console.log(`✓ Admin user (${ownerOpenId}) created or already exists`);

        // Insert a sample sale
        await db.insert(sales).values({
            saleCode: "2024-HOKKAIDO-TRAINING",
            saleName: "2024年度 北海道トレーニングセール",
            saleDate: new Date("2024-05-21"),
            catalogUrl: "https://www.hba.or.jp/catalog/20240521/index.html",
        }).onConflictDoNothing();

        console.log("✓ Sale data seeded");
        console.log("✓ Seed completed successfully");
    } catch (error) {
        console.error("Seed failed:", error);
    } finally {
        process.exit(0);
    }
}

seed();
