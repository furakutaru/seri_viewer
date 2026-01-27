import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// キャッシュディレクトリを初期化
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// URLのハッシュを生成
function getUrlHash(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

// キャッシュキーを生成
function getCacheKey(url: string, type: 'html' | 'pdf'): string {
  const hash = getUrlHash(url);
  return `${hash}.${type}`;
}

// キャッシュメタデータを取得
function getCacheMetadata(cacheKey: string) {
  const metaPath = path.join(CACHE_DIR, `${cacheKey}.meta.json`);
  if (fs.existsSync(metaPath)) {
    try {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

// キャッシュが有効かチェック
function isCacheValid(cacheKey: string): boolean {
  const metadata = getCacheMetadata(cacheKey);
  if (!metadata) return false;

  const age = Date.now() - metadata.timestamp;
  return age < CACHE_EXPIRY_MS;
}

// キャッシュから取得
export async function getFromCache(url: string, type: 'html' | 'pdf'): Promise<Buffer | null> {
  ensureCacheDir();
  const cacheKey = getCacheKey(url, type);
  const cachePath = path.join(CACHE_DIR, cacheKey);

  if (fs.existsSync(cachePath) && isCacheValid(cacheKey)) {
    console.log(`[Cache] Hit: ${url}`);
    return fs.readFileSync(cachePath);
  }

  return null;
}

// キャッシュに保存
export async function saveToCache(url: string, type: 'html' | 'pdf', data: Buffer): Promise<void> {
  ensureCacheDir();
  const cacheKey = getCacheKey(url, type);
  const cachePath = path.join(CACHE_DIR, cacheKey);
  const metaPath = path.join(CACHE_DIR, `${cacheKey}.meta.json`);

  fs.writeFileSync(cachePath, data);
  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      url,
      type,
      timestamp: Date.now(),
      size: data.length,
    })
  );

  console.log(`[Cache] Saved: ${url} (${data.length} bytes)`);
}

// キャッシュをクリア
export async function clearCache(): Promise<{ cleared: number; freed: number }> {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR);
  let cleared = 0;
  let freed = 0;

  for (const file of files) {
    const filePath = path.join(CACHE_DIR, file);
    const stat = fs.statSync(filePath);
    fs.unlinkSync(filePath);
    cleared++;
    freed += stat.size;
  }

  console.log(`[Cache] Cleared: ${cleared} files, ${freed} bytes freed`);
  return { cleared, freed };
}

// キャッシュ情報を取得
export async function getCacheInfo(): Promise<{
  totalFiles: number;
  totalSize: number;
  files: Array<{ url: string; type: string; size: number; age: number }>;
}> {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR);
  let totalSize = 0;
  const cacheFiles: Array<{ url: string; type: string; size: number; age: number }> = [];

  for (const file of files) {
    if (file.endsWith('.meta.json')) {
      const metaPath = path.join(CACHE_DIR, file);
      const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const filePath = path.join(CACHE_DIR, file.replace('.meta.json', ''));
      const stat = fs.statSync(filePath);
      const age = Date.now() - metadata.timestamp;

      cacheFiles.push({
        url: metadata.url,
        type: metadata.type,
        size: stat.size,
        age,
      });

      totalSize += stat.size;
    }
  }

  return {
    totalFiles: cacheFiles.length,
    totalSize,
    files: cacheFiles,
  };
}
