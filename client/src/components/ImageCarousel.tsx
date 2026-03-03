import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageCarousel({ images, alt, className = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 画像が1枚だけの場合はシンプル表示
  if (images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-12 text-center text-gray-500 ${className}`}>
        画像が登録されていません
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={`relative group ${className}`}>
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-auto rounded-lg shadow-md object-contain max-h-[500px] transition-transform duration-300 group-hover:scale-[1.02]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
          }}
        />
        <div className="mt-4 flex justify-end">
          <a
            href={images[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            画像を別タブで開く ↗
          </a>
        </div>
      </div>
    );
  }

  // 複数画像の場合はカルーセル表示
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={`relative ${className}`}>
      {/* メイン画像 */}
      <div className="relative group">
        <img
          src={images[currentIndex]}
          alt={`${alt} - 画像 ${currentIndex + 1}/${images.length}`}
          className="w-full h-auto rounded-lg shadow-md object-contain max-h-[500px] transition-transform duration-300 group-hover:scale-[1.02]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
          }}
        />
        
        {/* ナビゲーションボタン */}
        {images.length > 1 && (
          <>
            <Button
              onClick={goToPrevious}
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={goToNext}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* 画像インジケーター */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* サムネイル */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`${alt} - サムネイル ${index + 1}`}
                className="w-16 h-16 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/64x64?text=No+Image';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* 外部リンク */}
      <div className="mt-4 flex justify-end">
        <a
          href={images[currentIndex]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          画像を別タブで開く ↗
        </a>
      </div>
    </div>
  );
}
