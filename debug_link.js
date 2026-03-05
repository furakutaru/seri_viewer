// データベース接続テスト用スクリプト
// 実際のデータベース状況を確認する

// 環境変数を読み込み
import { config } from 'dotenv';
config({ path: '.env' });

console.log('=== データベース接続テスト ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

// 簡単なSQLクエリを生成して確認
console.log('\n=== 実行予定のSQL ===');
console.log('SELECT COUNT(*) as total FROM horses;');
console.log('SELECT COUNT(*) as with_jbis FROM horses WHERE jbisUrl IS NOT NULL AND jbisUrl != "";');
console.log('SELECT lotNumber FROM horses WHERE jbisUrl IS NULL OR jbisUrl = "" LIMIT 10;');

console.log('\n=== JBISリンク処理のデバッグ情報 ===');
console.log('1. JBISキャッシュデータ: 1462件（1-1462まで連番）');
console.log('2. 想定される問題点:');
console.log('   - データベースのlotNumberとJBISデータのhorseNameの不一致');
console.log('   - PDF修正後のデータベース更新でJBISリンクがクリアされた');
console.log('   - jbisHorseLinkerの正規化処理での不一致');

// 実際のリンク処理ロジックをシミュレート
console.log('\n=== リンク処理ロジック確認 ===');
console.log('jbisHorseLinker.tsの処理:');
console.log('1. lotNumberで既存馬を検索: eq(horses.lotNumber, lotNumber)');
console.log('2. 見つかった馬のjbisUrlを更新');
console.log('3. 父母のURLも馬名正規化で紐付け');

console.log('\n=== 次の調査ステップ ===');
console.log('1. データベースの実際のlotNumber一覧を取得');
console.log('2. JBISリンクがない馬のlotNumberを特定');
console.log('3. PDF修正前後のデータベース状態を比較');
