// Test script for Google Search API
const { googleSearchService } = require('./server/_core/googleSearch');

async function testGoogleSearch() {
  console.log('Testing Google Search API...');
  
  // Test with a famous horse
  const horseName = 'コパノリッキー';
  const result = await googleSearchService.searchJbisUrl(horseName);
  
  if (result) {
    console.log(`✅ Success! Found JBIS URL for ${horseName}:`);
    console.log(result);
  } else {
    console.log(`❌ No JBIS URL found for ${horseName}`);
  }
}

testGoogleSearch().catch(console.error);
