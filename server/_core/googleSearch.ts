import { ENV } from './env';

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface GoogleSearchResponse {
  items: GoogleSearchResult[];
  searchInformation: {
    totalResults: string;
    searchTime: number;
  };
}

export class GoogleSearchService {
  private apiKey: string;
  private cx: string;

  constructor() {
    this.apiKey = ENV.googleSearchApiKey;
    this.cx = ENV.googleSearchCx;
  }

  async searchJbisUrl(horseName: string): Promise<string | null> {
    console.log(`[GoogleSearch] apiKey: "${this.apiKey}", cx: "${this.cx}"`);
    if (!this.apiKey || !this.cx) {
      console.warn('[GoogleSearch] API key or CX not configured - skipping search');
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
        console.log(`[GoogleSearch] Trying query: ${query}`);
        
        // Correct endpoint URL with proper parameters
        const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.cx}&q=${encodeURIComponent(query)}&num=10`;
        
        const response = await fetch(url);
        
        console.log(`[GoogleSearch] Response status: ${response.status}`);
        
        if (response.status === 403) {
          const errorText = await response.text();
          console.warn(`[GoogleSearch] API access denied: ${response.status} ${response.statusText} - ${errorText}`);
          return null;
        }
        
        if (response.status === 400 || response.status === 401) {
          console.warn('[GoogleSearch] API key invalid or expired - skipping search');
          return null;
        }
        
        if (!response.ok) {
          console.warn(`[GoogleSearch] API error: ${response.status} - ${response.statusText}`);
          continue; // Try next query
        }

        const data: GoogleSearchResponse = await response.json();
        console.log(`[GoogleSearch] Found ${data.items?.length || 0} results`);
        
        if (!data.items || data.items.length === 0) {
          console.log(`[GoogleSearch] No results for query: ${query}`);
          continue; // Try next query
        }

        // Find JBIS horse URL with more flexible matching
        const jbisResult = data.items.find(item => {
          const link = item.link.toLowerCase();
          return link.includes('jbis.or.jp') && 
                 (link.includes('/horse/') || link.includes('horse')) &&
                 !link.includes('list') &&
                 !link.includes('search') &&
                 !link.includes('news') &&
                 !link.includes('pdf');
        });

        if (jbisResult) {
          console.log(`[GoogleSearch] Found JBIS URL for ${horseName}: ${jbisResult.link}`);
          return jbisResult.link;
        }

        console.log(`[GoogleSearch] No JBIS URL found in results for query: ${query}`);
        
      } catch (error) {
        console.warn(`[GoogleSearch] Error with query "${query}":`, error);
        continue; // Try next query
      }
    }

    console.log(`[GoogleSearch] No JBIS URL found for ${horseName} with any query`);
    return null;
  }
}

export const googleSearchService = new GoogleSearchService();
