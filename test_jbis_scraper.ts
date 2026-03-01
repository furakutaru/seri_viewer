import 'dotenv/config';
import { jbisScraperService } from './server/_core/jbisScraper';

async function testJbisScraper() {
  const testUrl = 'https://www.jbis.or.jp/seri/2025/11B3/sale/';
  
  console.log('Testing JBIS scraper...');
  console.log(`URL: ${testUrl}`);
  
  // Clear cache to force fresh fetch
  console.log('Clearing cache...');
  jbisScraperService.clearCache();
  
  try {
    const result = await jbisScraperService.scrapeSalePage(testUrl);
    
    console.log(`\nFound ${result.length} horses:`);
    result.slice(0, 5).forEach((horse, index) => {
      console.log(`${index + 1}. ${horse.horseName}`);
      console.log(`   URL: ${horse.horseUrl}`);
      console.log(`   Sire: ${horse.sireName} -> ${horse.sireUrl}`);
      console.log(`   Dam: ${horse.damName} -> ${horse.damUrl}`);
      console.log('');
    });
    
    if (result.length > 5) {
      console.log(`... and ${result.length - 5} more horses`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testJbisScraper();
