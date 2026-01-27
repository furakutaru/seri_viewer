import fetch from 'node-fetch';

// 開発サーバーのAPIエンドポイント
const API_URL = 'http://localhost:3000/api/trpc/import.importCatalogAndMeasurements';

// テストデータ
const testData = {
  saleId: 1,
  catalogUrl: 'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.html',
  pdfUrls: [
    'https://w2.hba.or.jp/upload/1ce8de6cf8804f14a89b6158b3dedb55/00306eaaad213bdcf3ce05da27fbf5d2.pdf',
  ],
};

console.log('Testing data import...');
console.log(`API URL: ${API_URL}`);
console.log(`Test data:`, JSON.stringify(testData, null, 2));

// API呼び出し
try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: testData,
    }),
  });

  const result = await response.json();
  console.log('\nAPI Response:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}
