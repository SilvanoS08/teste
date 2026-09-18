export interface StockQuote {
  symbol: string;
  name: string;
  shortName: string;
  regularMarketPrice: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  regularMarketOpen: number | null;
  regularMarketDayHigh: number | null;
  regularMarketDayLow: number | null;
  regularMarketVolume: number | null;
  previousClose: number | null;
  currency: string;
  updatedAt: string;
  updatedAtFormatted: string;
  isIndex?: boolean;
  status: 'available' | 'unavailable' | 'error';
  errorMessage?: string;
  sparkline?: number[];
  historicalPoints?: {
    time: string;
    price: number;
    volume?: number;
  }[];
}

export type MarketStatusType = 'open' | 'closed' | 'pre-market' | 'after-market';

export interface MarketStatusInfo {
  status: MarketStatusType;
  label: string;
  sublabel: string;
  color: 'green' | 'red' | 'yellow';
  brasiliaTime: string;
  brasiliaDate: string;
  isOpen: boolean;
  nextEventDescription: string;
  marketSchedule: string;
}

export interface QuotesResponse {
  success: boolean;
  timestamp: string;
  brasiliaTime: string;
  marketStatus: MarketStatusInfo;
  ibov: StockQuote | null;
  stocks: StockQuote[];
  allQuotes: StockQuote[];
  source: string;
  cached: boolean;
  error?: string;
}

export interface MarketHighlights {
  topGainer: StockQuote | null;
  topLoser: StockQuote | null;
  highestPrice: StockQuote | null;
  highestVolume: StockQuote | null;
  highestVolatility: StockQuote | null;
}

export type TableFilterType = 'all' | 'gainers' | 'losers' | 'neutral';
export type TableSortField = 'symbol' | 'name' | 'price' | 'change' | 'changePercent' | 'open' | 'high' | 'low' | 'volume' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';
