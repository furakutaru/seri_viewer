// Simple test for Google API
const https = require('https');

async function testGoogleAPI() {
  try {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;
    
    console.log('API Key:', apiKey ? 'Set' : 'Not set');
    console.log('CX:', cx ? 'Set' : 'Not set');
    
    if (!apiKey || !cx) {
      console.log('❌ API keys not set');
      return;
    }
    
    const query = 'コパノリッキー site:jbis.or.jp/horse/';
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
    
    console.log('Testing URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success! Results count:', data.items?.length || 0);
    
    if (data.items?.length > 0) {
      const jbisResult = data.items.find(item => 
        item.link.includes('jbis.or.jp/horse/') &&
        !item.link.includes('list') &&
        !item.link.includes('search')
      );
      
      if (jbisResult) {
        console.log('✅ Found JBIS URL:', jbisResult.link);
      } else {
        console.log('❌ No JBIS URL found in results');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGoogleAPI();
