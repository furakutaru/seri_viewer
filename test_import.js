import { importCatalogAndMeasurements } from './server/import-data.ts';
import { config } from 'dotenv';

// Load environment variables
config();

async function testImport() {
  try {
    console.log('Testing import with 1 horse...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    const result = await importCatalogAndMeasurements(
      1,
      "https://wmp512t973.user-space.cdn.idcfcloud.net/catalog/20250801/index_all250818.html",
      ["https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf"]
    );
    
    console.log('Import result:', result);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

testImport();
