import https from 'https';

async function testAPIKey() {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;  
  console.log('=== API Key Test ===');
  console.log('API Key exists:', !!apiKey);
  console.log('CX exists:', !!cx);
  
  if (!apiKey || !cx) {
    console.log('❌ Missing API credentials');
    return;
  }
  
  // Test with a simple query
  const testUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=test&num=1`;
  
  try {
    const response = await fetch(testUrl);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid!');
      console.log('Search context:', data.context?.title);
    } else {
      const errorText = await response.text();
      console.log('❌ API key error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testAPIKey();
