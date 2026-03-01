import { ENV } from './env';

interface BingSearchResult {
  name: string;
  url: string;
  snippet: string;
}

interface BingSearchResponse {
  webPages: {
    value: BingSearchResult[];
  };
}

export class BingSearchService {
  private apiKey: string;

  constructor() {
    this.apiKey = ENV.bingSearchApiKey || '';
  }

  async searchJbisUrl(horseName: string): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('[BingSearch] API key not configured - skipping search');
      return null;
    }

    // Try different query formats
    const queries = [
      `"${horseName}" site:jbis.or.jp/horse/`,
      `${horseName} site:jbis.or.jp/horse/`,
      `${horseName} JBIS 競走馬`,
      `${horseName} 血統`,
    ];

    for (const query of queries) {
      try {
        console.log(`[BingSearch] Trying query: ${query}`);
        
        const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10`;
        
        const response = await fetch(url, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
          }
        });
        
        console.log(`[BingSearch] Response status: ${response.status}`);
        
        if (response.status === 401) {
          console.warn('[BingSearch] API key invalid - skipping search');
          return null;
        }
        
        if (response.status === 429) {
          console.warn('[BingSearch] Rate limit exceeded - skipping search');
          return null;
        }
        
        if (!response.ok) {
          console.warn(`[BingSearch] API error: ${response.status} - ${response.statusText}`);
          continue; // Try next query
        }

        const data: BingSearchResponse = await response.json();
        console.log(`[BingSearch] Found ${data.webPages?.value?.length || 0} results`);
        
        if (!data.webPages?.value || data.webPages.value.length === 0) {
          console.log(`[BingSearch] No results for query: ${query}`);
          continue; // Try next query
        }

        // Find JBIS horse URL with more flexible matching
        const jbisResult = data.webPages.value.find(item => {
          const url = item.url.toLowerCase();
          return url.includes('jbis.or.jp') && 
                 (url.includes('/horse/') || url.includes('horse')) &&
                 !url.includes('list') &&
                 !url.includes('search') &&
                 !url.includes('news') &&
                 !url.includes('pdf');
        });

        if (jbisResult) {
          console.log(`[BingSearch] Found JBIS URL for ${horseName}: ${jbisResult.url}`);
          return jbisResult.url;
        }

        console.log(`[BingSearch] No JBIS URL found in results for query: ${query}`);
        
      } catch (error) {
        console.warn(`[BingSearch] Error with query "${query}":`, error);
        continue; // Try next query
      }
    }

    console.log(`[BingSearch] No JBIS URL found for ${horseName} with any query`);
    return null;
  }
}

export const bingSearchService = new BingSearchService();
