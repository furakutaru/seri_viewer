/**
 * api/index.js 専用ビルドスクリプト
 * pdf-parseはVercelのサーバーレス環境でnode_modulesが見つからないため、
 * バンドルに含める（--packages=externalの除外対象から外す）
 */
import { build } from 'esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// 全依存パッケージをリストアップし、pdf-parseのみをバンドル対象とする
const allDeps = Object.keys(pkg.dependencies || {});
const external = allDeps
    .filter(name => name !== 'pdf-parse')
    .flatMap(name => [name, `${name}/*`]);

await build({
    entryPoints: ['server/_core/index.ts'],
    platform: 'node',
    bundle: true,
    format: 'esm',
    outfile: 'api/index.js',
    external,
    // pdf-parseのCJS->ESM変換を適切に処理する
    banner: {
        js: `
// Required for pdf-parse CJS interop
import { createRequire as _createRequire } from 'module';
const require = _createRequire(import.meta.url);
`.trimStart(),
    },
});

console.log('✓ api/index.js built with pdf-parse bundled');
