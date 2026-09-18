import { QuotesResponse, StockQuote, MarketStatusInfo } from '../types';

const STORAGE_KEY_QUOTES = 'b3_dashboard_quotes_cache';
const STORAGE_KEY_TIMESTAMP = 'b3_dashboard_quotes_timestamp';

export interface FetchResult {
  data: QuotesResponse | null;
  error: string | null;
  isCachedFallback: boolean;
}

export async function fetchMarketQuotes(forceRefresh: boolean = false): Promise<FetchResult> {
  try {
    const url = `/api/quotes${forceRefresh ? '?refresh=true' : ''}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Servidor respondeu com status ${response.status}`);
    }

    const data: QuotesResponse = await response.json();

    if (data.success && data.allQuotes && data.allQuotes.length > 0) {
      // Save valid response to localStorage as backup
      try {
        localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY_TIMESTAMP, new Date().toISOString());
      } catch {
        // LocalStorage quota or disabled
      }

      return {
        data,
        error: null,
        isCachedFallback: false,
      };
    } else {
      throw new Error(data.error || 'Não foi possível carregar as cotações');
    }
  } catch (err: any) {
    console.error('Fetch quotes failed, attempting local cache fallback:', err);
    
    // Attempt local storage fallback per rule 13: "Manter na tela a última cotação válida recebida"
    try {
      const cached = localStorage.getItem(STORAGE_KEY_QUOTES);
      if (cached) {
        const parsed: QuotesResponse = JSON.parse(cached);
        return {
          data: parsed,
          error: 'Não foi possível atualizar as cotações. Exibindo última cotação válida.',
          isCachedFallback: true,
        };
      }
    } catch {
      // Cache reading failed
    }

    return {
      data: null,
      error: 'Não foi possível atualizar as cotações.',
      isCachedFallback: false,
    };
  }
}

export async function fetchQuoteHistory(symbol: string, range: string = '1d'): Promise<{
  points: Array<{ time: string; price: number; volume?: number }>;
  symbol: string;
  name: string;
} | null> {
  try {
    const response = await fetch(`/api/quote/${encodeURIComponent(symbol)}/history?range=${encodeURIComponent(range)}`);
    if (!response.ok) return null;
    const json = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error(`Failed to fetch history for ${symbol}:`, err);
    return null;
  }
}
