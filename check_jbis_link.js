import fs from 'fs';
import path from 'path';

// JBISキャッシュデータを読み込み
const jbisCachePath = '.cache/jbis/aHR0cHM6Ly93d3cuamJpcy5vci5qcC9zZXJpLzIwMjUvMTFCMy9zYWxlLw.json';
const jbisData = JSON.parse(fs.readFileSync(jbisCachePath, 'utf8'));

console.log('=== JBISデータ分析 ===');
console.log('総件数:', jbisData.data.length);

// 上場番号のリストを作成
const jbisLotNumbers = jbisData.data.map(h => parseInt(h.horseName)).sort((a, b) => a - b);

// 欠番をチェック
const missingNumbers = [];
for (let i = 1; i <= 1462; i++) {
  if (!jbisLotNumbers.includes(i)) {
    missingNumbers.push(i);
  }
}

console.log('欠番:', missingNumbers.length, '件');
if (missingNumbers.length > 0) {
  console.log('欠番一覧（最初20件）:', missingNumbers.slice(0, 20));
}

// 重複をチェック
const duplicates = jbisLotNumbers.filter((num, index) => jbisLotNumbers.indexOf(num) !== index);
if (duplicates.length > 0) {
  console.log('重複:', [...new Set(duplicates)].length, '件');
  console.log('重複一覧:', [...new Set(duplicates)].slice(0, 10));
} else {
  console.log('重複: 0件');
}

// 範囲チェック
console.log('最小上場番号:', Math.min(...jbisLotNumbers));
console.log('最大上場番号:', Math.max(...jbisLotNumbers));

// 100件ごとの集計
const ranges = [];
for (let i = 1; i <= 1462; i += 100) {
  const end = Math.min(i + 99, 1462);
  const count = jbisLotNumbers.filter(num => num >= i && num <= end).length;
  ranges.push(`${i}-${end}: ${count}件`);
}

console.log('\n=== 100件ごとの集計 ===');
ranges.forEach(range => console.log(range));
