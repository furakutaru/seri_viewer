-- 複数画像対応のためのマイグレーション
-- 既存のphotoUrlを保持しつつ、新しい画像URL配列フィールドを追加

-- 新しい画像URL配列フィールドを追加
ALTER TABLE horses 
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- 既存のphotoUrlをimage_urlsの最初の要素に移行
UPDATE horses 
SET image_urls = ARRAY[photoUrl] 
WHERE photoUrl IS NOT NULL AND photoUrl != '';

-- 既存のphotoUrlフィールドは互換性のために残す（将来的に削除可能）
COMMENT ON COLUMN horses.photoUrl IS 'Legacy single image URL - use image_urls instead';
COMMENT ON COLUMN horses.image_urls IS 'Array of horse image URLs for carousel display';
