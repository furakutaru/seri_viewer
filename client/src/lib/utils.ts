import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAbsoluteUrl(relativeUrl: string | null | undefined, catalogUrl: string | null | undefined): string | null {
  if (!relativeUrl) return null;
  if (!catalogUrl) return relativeUrl;

  if (relativeUrl.startsWith('http')) return relativeUrl;

  try {
    const url = new URL(catalogUrl);
    // index.htmlなどを除いたベースディレクトリを取得
    const baseDir = url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);

    // URLオブジェクトを使って解決（../なども考慮される）
    const absoluteUrl = new URL(relativeUrl, baseDir).href;
    return absoluteUrl;
  } catch (e) {
    console.error('Failed to resolve URL:', e);
    return relativeUrl;
  }
}
