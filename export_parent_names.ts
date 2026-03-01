import 'dotenv/config';
import { getDb } from './server/db';
import { horses } from './drizzle/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function exportParentNames() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  try {
    // Get all unique sire and dam names
    const result = await db.select({
      sireName: horses.sireName,
      damName: horses.damName
    }).from(horses).where(sql`${horses.sireName} IS NOT NULL OR ${horses.damName} IS NOT NULL`);

    // Extract and deduplicate names
    const sireNames = new Set<string>();
    const damNames = new Set<string>();

    result.forEach(row => {
      if (row.sireName) sireNames.add(row.sireName);
      if (row.damName) damNames.add(row.damName);
    });

    // Convert to arrays and sort
    const sireArray = Array.from(sireNames).sort();
    const damArray = Array.from(damNames).sort();

    // Create CSV content
    let csvContent = 'keywords\n';
    sireArray.forEach(name => {
      csvContent += `"${name}"\n`;
    });
    damArray.forEach(name => {
      csvContent += `"${name}"\n`;
    });

    // Write to file
    const outputPath = path.join(process.cwd(), 'parent_names.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`Exported ${sireArray.length} unique sire names and ${damArray.length} unique dam names to ${outputPath}`);
    console.log(`Total: ${sireArray.length + damArray.length} names`);

  } catch (error) {
    console.error('Error exporting parent names:', error);
  }
}

// Run the export
exportParentNames();
