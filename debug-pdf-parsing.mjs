import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const pdfPath = '/home/ubuntu/seri_viewer/.cache/48ebc3f0f7582a3962a1115f2d858b7b.pdf';
const tmpDir = os.tmpdir();
const txtPath = path.join(tmpDir, `debug_${Date.now()}.txt`);

execSync(`pdftotext "${pdfPath}" "${txtPath}"`, { encoding: 'utf-8' });
const text = fs.readFileSync(txtPath, 'utf-8');
const lines = text.split('\n');

// ヘッダー行を探す
let headerIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('番号')) {
    headerIdx = i;
    break;
  }
}

console.log(`Header found at line ${headerIdx}`);

// 上場番号のセクションを探す
let lotNumbersStart = headerIdx + 1;
while (lotNumbersStart < lines.length && !/^\d+$/.test(lines[lotNumbersStart].trim())) {
  lotNumbersStart++;
}

console.log(`Lot numbers start at line ${lotNumbersStart}`);

// 上場番号を収集
const lotNumbers = [];
let i = lotNumbersStart;
let firstNum = parseInt(lines[lotNumbersStart].trim());
let expectedNum = firstNum;

console.log(`\nFirst lot number: ${firstNum}`);
console.log(`Expected sequence: ${firstNum} -> ${firstNum + 1} -> ${firstNum + 2}...`);

while (i < lines.length) {
  const line = lines[i].trim();
  
  if (/^\d+$/.test(line)) {
    const num = parseInt(line);
    
    if (num === expectedNum) {
      lotNumbers.push(num);
      expectedNum++;
      i++;
    } else {
      console.log(`\nBreaking at line ${i}: expected ${expectedNum}, got ${num}`);
      break;
    }
  } else if (line === '') {
    i++;
  } else {
    console.log(`\nBreaking at line ${i}: non-numeric line: "${line}"`);
    break;
  }
}

console.log(`\nCollected lot numbers: ${lotNumbers.join(', ')}`);
console.log(`Total lot numbers: ${lotNumbers.length}`);

// 測尺データを収集
let measurementStart = i;
while (measurementStart < lines.length && lines[measurementStart].trim() === '') {
  measurementStart++;
}

console.log(`\nMeasurement data starts at line ${measurementStart}`);
console.log(`First 20 measurement lines:`);

const measurementLines = [];
for (let j = measurementStart; j < Math.min(measurementStart + 30, lines.length); j++) {
  const line = lines[j].trim();
  
  if (line.includes('販売希望') || line.includes('価格') || line.includes('レポジトリー')) {
    console.log(`Breaking at line ${j}: "${line}"`);
    break;
  }
  
  if (line !== '') {
    measurementLines.push(line);
    console.log(`  ${measurementLines.length}: "${line}"`);
  }
}

console.log(`\nTotal measurement lines collected: ${measurementLines.length}`);
console.log(`Expected measurement lines: ${lotNumbers.length * 3} (for 3 values per horse, excluding 欠場)`);

fs.unlinkSync(txtPath);
