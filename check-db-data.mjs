import fetch from 'node-fetch';

async function checkData() {
  try {
    const response = await fetch('http://localhost:3000/api/trpc/horses.listBySale?input={"json":{"saleId":1}}');
    const result = await response.json();
    
    console.log('API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.result && result.result.data) {
      const horses = result.result.data.slice(0, 5);
      console.log('\n=== First 5 horses ===');
      horses.forEach(horse => {
        console.log(`Lot ${horse.lotNumber}: sireName="${horse.sireName}", damName="${horse.damName}"`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();
