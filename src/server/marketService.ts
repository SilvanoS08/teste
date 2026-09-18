import { StockQuote, MarketStatusInfo, QuotesResponse } from '../types.js';

export interface AssetDefinition {
  symbol: string;
  name: string;
  shortName: string;
  yahooSymbol: string;
  brapiSymbol: string;
  alternativeSymbols?: string[];
  isIndex?: boolean;
}

export const TARGET_ASSETS: AssetDefinition[] = [
  {
    symbol: 'IBOV',
    name: 'Índice Bovespa (Ibovespa)',
    shortName: 'Ibovespa',
    yahooSymbol: '^BVSP',
    brapiSymbol: '^BVSP',
    isIndex: true,
  },
  {
    symbol: 'BBAS3',
    name: 'Banco do Brasil S.A.',
    shortName: 'Banco do Brasil',
    yahooSymbol: 'BBAS3.SA',
    brapiSymbol: 'BBAS3',
  },
  {
    symbol: 'VALE3',
    name: 'Vale S.A.',
    shortName: 'Vale',
    yahooSymbol: 'VALE3.SA',
    brapiSymbol: 'VALE3',
  },
  {
    symbol: 'PETR4',
    name: 'Petróleo Brasileiro S.A. - Petrobras',
    shortName: 'Petrobras PN',
    yahooSymbol: 'PETR4.SA',
    brapiSymbol: 'PETR4',
  },
  {
    symbol: 'ISAE3',
    name: 'ISA CTEEP (ISA Energia Brasil)',
    shortName: 'ISA Energia',
    yahooSymbol: 'ISAE3.SA',
    brapiSymbol: 'ISAE3',
    alternativeSymbols: ['TRPL4.SA', 'TRPL4'],
  },
  {
    symbol: 'AMER3',
    name: 'Americanas S.A.',
    shortName: 'Americanas',
    yahooSymbol: 'AMER3.SA',
    brapiSymbol: 'AMER3',
  },
  {
    symbol: 'MGLU3',
    name: 'Magazine Luiza S.A.',
    shortName: 'Magazine Luiza',
    yahooSymbol: 'MGLU3.SA',
    brapiSymbol: 'MGLU3',
  },
  {
    symbol: 'CSNA3',
    name: 'Companhia Siderúrgica Nacional',
    shortName: 'CSN',
    yahooSymbol: 'CSNA3.SA',
    brapiSymbol: 'CSNA3',
  },
  {
    symbol: 'BBDC4',
    name: 'Banco Bradesco S.A.',
    shortName: 'Bradesco PN',
    yahooSymbol: 'BBDC4.SA',
    brapiSymbol: 'BBDC4',
  },
  {
    symbol: 'BHIA3',
    name: 'Casas Bahia S.A.',
    shortName: 'Casas Bahia',
    yahooSymbol: 'BHIA3.SA',
    brapiSymbol: 'BHIA3',
  },
  {
    symbol: 'TAEE4',
    name: 'Transmissora Aliança de Energia Elétrica S.A.',
    shortName: 'Taesa PN',
    yahooSymbol: 'TAEE4.SA',
    brapiSymbol: 'TAEE4',
  },
  {
    symbol: 'BBSE3',
    name: 'BB Seguridade Participações S.A.',
    shortName: 'BB Seguridade',
    yahooSymbol: 'BBSE3.SA',
    brapiSymbol: 'BBSE3',
  },
];

// In-memory cache for quotes and historical session points
let cachedQuotes: Map<string, StockQuote> = new Map();
let intradayHistoryStore: Map<string, Array<{ time: string; price: number; volume?: number }>> = new Map();
let lastFetchTimestamp: number = 0;
const CACHE_TTL_MS = 25 * 1000; // 25 seconds cache to balance responsiveness and rate limits

export function getBrasiliaDate(): Date {
  // Convert current UTC time to America/Sao_Paulo (UTC-3)
  const now = new Date();
  const spTimeString = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  return new Date(spTimeString);
}

export function formatBrasiliaTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatBrasiliaDate(date: Date = new Date()): string {
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getMarketStatus(): MarketStatusInfo {
  const bDate = getBrasiliaDate();
  const dayOfWeek = bDate.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = bDate.getHours();
  const minutes = bDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const timeStr = formatBrasiliaTime();
  const dateStr = formatBrasiliaDate();

  // Weekend: Saturday (6) or Sunday (0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      status: 'closed',
      label: 'Mercado Fechado',
      sublabel: `Fim de semana — Próxima abertura na segunda-feira às 10:00`,
      color: 'red',
      brasiliaTime: timeStr,
      brasiliaDate: dateStr,
      isOpen: false,
      nextEventDescription: 'Abertura na segunda-feira às 10:00',
      marketSchedule: 'Pregão regular das 10:00 às 17:00 (Brasília)',
    };
  }

  // Weekday trading phases:
  // 00:00 - 09:45: Closed
  // 09:45 - 10:00: Pre-market
  // 10:00 - 17:00: Regular Trading
  // 17:00 - 17:15: Closing Call / After-market
  // 17:15 - 18:00: After-market
  // 18:00 - 23:59: Closed
  const preMarketStart = 9 * 60 + 45; // 09:45
  const marketOpen = 10 * 60; // 10:00
  const marketClose = 17 * 60; // 17:00
  const afterMarketEnd = 18 * 60; // 18:00

  if (totalMinutes < preMarketStart) {
    return {
      status: 'closed',
      label: 'Mercado Fechado',
      sublabel: `Abertura do pregão regular às 10:00`,
      color: 'red',
      brasiliaTime: timeStr,
      brasiliaDate: dateStr,
      isOpen: false,
      nextEventDescription: 'Pré-abertura às 09:45, Pregão às 10:00',
      marketSchedule: 'Pregão regular das 10:00 às 17:00 (Brasília)',
    };
  }

  if (totalMinutes >= preMarketStart && totalMinutes < marketOpen) {
    return {
      status: 'pre-market',
      label: 'Pré-Abertura',
      sublabel: `Leilão de abertura em andamento — Início do pregão às 10:00`,
      color: 'yellow',
      brasiliaTime: timeStr,
      brasiliaDate: dateStr,
      isOpen: false,
      nextEventDescription: 'Início das negociações às 10:00',
      marketSchedule: 'Pregão regular das 10:00 às 17:00 (Brasília)',
    };
  }

  if (totalMinutes >= marketOpen && totalMinutes < marketClose) {
    return {
      status: 'open',
      label: 'Mercado Aberto',
      sublabel: `Pregão em andamento — Encerramento regular às 17:00`,
      color: 'green',
      brasiliaTime: timeStr,
      brasiliaDate: dateStr,
      isOpen: true,
      nextEventDescription: 'Fechamento regular às 17:00',
      marketSchedule: 'Pregão regular das 10:00 às 17:00 (Brasília)',
    };
  }

  if (totalMinutes >= marketClose && totalMinutes < afterMarketEnd) {
    return {
      status: 'after-market',
      label: 'Pós-Mercado / Call',
      sublabel: `After-market B3 — Encerramento às 18:00`,
      color: 'yellow',
      brasiliaTime: timeStr,
      brasiliaDate: dateStr,
      isOpen: false,
      nextEventDescription: 'Encerramento total às 18:00',
      marketSchedule: 'Pregão regular das 10:00 às 17:00 (Brasília)',
    };
  }

  return {
    status: 'closed',
    label: 'Mercado Fechado',
    sublabel: `Pregão encerrado — Próxima abertura amanhã às 10:00`,
    color: 'red',
    brasiliaTime: timeStr,
    brasiliaDate: dateStr,
    isOpen: false,
    nextEventDescription: 'Abertura no próximo dia útil às 10:00',
    marketSchedule: 'Pregão regular das 10:00 às 17:00 (Brasília)',
  };
}

// Fetch single quote with Yahoo Finance v8 chart API (reliable, real, includes intradiary points)
async function fetchYahooQuote(asset: AssetDefinition): Promise<StockQuote | null> {
  const symbolsToTry = [asset.yahooSymbol, ...(asset.alternativeSymbols || [])];

  for (const sym of symbolsToTry) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=5m&range=1d&includePrePost=true`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      const timestamps: number[] = result.timestamp || [];

      const currentPrice = meta.regularMarketPrice ?? meta.previousClose ?? null;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
      const regularMarketChange = (currentPrice !== null && prevClose !== null) ? (currentPrice - prevClose) : null;
      const regularMarketChangePercent = (currentPrice !== null && prevClose !== null && prevClose !== 0) 
        ? ((currentPrice - prevClose) / prevClose) * 100 
        : null;

      // Extract valid intradiary points
      const historicalPoints: Array<{ time: string; price: number; volume?: number }> = [];
      const sparkline: number[] = [];

      if (quote?.close && timestamps.length > 0) {
        for (let i = 0; i < timestamps.length; i++) {
          const price = quote.close[i];
          if (typeof price === 'number' && !isNaN(price)) {
            const timeDate = new Date(timestamps[i] * 1000);
            const timeFormatted = timeDate.toLocaleTimeString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              hour: '2-digit',
              minute: '2-digit',
            });
            historicalPoints.push({
              time: timeFormatted,
              price: Number(price.toFixed(2)),
              volume: quote.volume?.[i] ?? 0,
            });
            sparkline.push(Number(price.toFixed(2)));
          }
        }
      }

      // If no points in chart (e.g. before open or holiday), create a point from current price
      if (historicalPoints.length === 0 && currentPrice !== null) {
        const timeNow = formatBrasiliaTime().slice(0, 5);
        historicalPoints.push({
          time: timeNow,
          price: Number(currentPrice.toFixed(2)),
          volume: meta.regularMarketVolume || 0,
        });
        sparkline.push(Number(currentPrice.toFixed(2)));
      }

      const updatedAtDate = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : new Date();

      return {
        symbol: asset.symbol,
        name: meta.longName || asset.name,
        shortName: meta.shortName || asset.shortName,
        regularMarketPrice: currentPrice !== null ? Number(currentPrice.toFixed(2)) : null,
        regularMarketChange: regularMarketChange !== null ? Number(regularMarketChange.toFixed(2)) : null,
        regularMarketChangePercent: regularMarketChangePercent !== null ? Number(regularMarketChangePercent.toFixed(2)) : null,
        regularMarketOpen: meta.regularMarketDayLow !== undefined && meta.regularMarketOpen !== undefined 
          ? Number(meta.regularMarketOpen.toFixed(2)) 
          : (meta.previousClose !== undefined ? Number(meta.previousClose.toFixed(2)) : null),
        regularMarketDayHigh: meta.regularMarketDayHigh !== undefined ? Number(meta.regularMarketDayHigh.toFixed(2)) : currentPrice,
        regularMarketDayLow: meta.regularMarketDayLow !== undefined ? Number(meta.regularMarketDayLow.toFixed(2)) : currentPrice,
        regularMarketVolume: meta.regularMarketVolume ?? null,
        previousClose: prevClose !== null ? Number(prevClose.toFixed(2)) : null,
        currency: meta.currency || 'BRL',
        updatedAt: updatedAtDate.toISOString(),
        updatedAtFormatted: formatBrasiliaTime(updatedAtDate),
        isIndex: asset.isIndex,
        status: currentPrice !== null ? 'available' : 'unavailable',
        sparkline: sparkline.length > 0 ? sparkline : undefined,
        historicalPoints: historicalPoints.length > 0 ? historicalPoints : undefined,
      };
    } catch {
      // Continue to next symbol fallback
    }
  }

  return null;
}

// Fallback provider using Brapi (Brazilian Stocks API)
async function fetchBrapiQuotes(): Promise<Map<string, Partial<StockQuote>>> {
  const map = new Map<string, Partial<StockQuote>>();
  try {
    const token = process.env.BRAPI_TOKEN;
    const symbolsList = TARGET_ASSETS.map(a => a.brapiSymbol).join(',');
    const url = `https://brapi.dev/api/quote/${encodeURIComponent(symbolsList)}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.results)) {
        for (const item of data.results) {
          const match = TARGET_ASSETS.find(a => a.brapiSymbol === item.symbol || a.symbol === item.symbol);
          if (match) {
            map.set(match.symbol, {
              symbol: match.symbol,
              name: item.longName || match.name,
              shortName: item.shortName || match.shortName,
              regularMarketPrice: item.regularMarketPrice !== undefined ? Number(item.regularMarketPrice.toFixed(2)) : null,
              regularMarketChange: item.regularMarketChange !== undefined ? Number(item.regularMarketChange.toFixed(2)) : null,
              regularMarketChangePercent: item.regularMarketChangePercent !== undefined ? Number(item.regularMarketChangePercent.toFixed(2)) : null,
              regularMarketOpen: item.regularMarketOpen !== undefined ? Number(item.regularMarketOpen.toFixed(2)) : null,
              regularMarketDayHigh: item.regularMarketDayHigh !== undefined ? Number(item.regularMarketDayHigh.toFixed(2)) : null,
              regularMarketDayLow: item.regularMarketDayLow !== undefined ? Number(item.regularMarketDayLow.toFixed(2)) : null,
              regularMarketVolume: item.regularMarketVolume ?? null,
              updatedAt: item.regularMarketTime ? new Date(item.regularMarketTime).toISOString() : new Date().toISOString(),
              updatedAtFormatted: formatBrasiliaTime(),
              status: item.regularMarketPrice !== undefined ? 'available' : 'unavailable',
            });
          }
        }
      }
    }
  } catch {
    // Brapi fallback failover
  }
  return map;
}

export async function getAllQuotes(forceRefresh: boolean = false): Promise<QuotesResponse> {
  const now = Date.now();
  const marketStatus = getMarketStatus();

  // Return cache if still fresh and not forced
  if (!forceRefresh && cachedQuotes.size === TARGET_ASSETS.length && (now - lastFetchTimestamp) < CACHE_TTL_MS) {
    const quotesList = TARGET_ASSETS.map(a => cachedQuotes.get(a.symbol)!);
    const ibovQuote = quotesList.find(q => q.symbol === 'IBOV') || null;
    const stockQuotes = quotesList.filter(q => q.symbol !== 'IBOV');

    return {
      success: true,
      timestamp: new Date().toISOString(),
      brasiliaTime: formatBrasiliaTime(),
      marketStatus,
      ibov: ibovQuote,
      stocks: stockQuotes,
      allQuotes: quotesList,
      source: 'Cache do Servidor B3',
      cached: true,
    };
  }

  // Fetch in parallel for all assets with Yahoo Finance and Brapi
  const results = await Promise.allSettled(
    TARGET_ASSETS.map(asset => fetchYahooQuote(asset))
  );

  let brapiFallback: Map<string, Partial<StockQuote>> | null = null;

  for (let i = 0; i < TARGET_ASSETS.length; i++) {
    const asset = TARGET_ASSETS[i];
    const res = results[i];
    let quote: StockQuote | null = res.status === 'fulfilled' ? res.value : null;

    // If Yahoo didn't return data, try Brapi
    if (!quote || quote.regularMarketPrice === null) {
      if (!brapiFallback) {
        brapiFallback = await fetchBrapiQuotes();
      }
      const brapiItem = brapiFallback.get(asset.symbol);
      if (brapiItem && brapiItem.regularMarketPrice !== null && brapiItem.regularMarketPrice !== undefined) {
        quote = {
          symbol: asset.symbol,
          name: asset.name,
          shortName: asset.shortName,
          regularMarketPrice: brapiItem.regularMarketPrice,
          regularMarketChange: brapiItem.regularMarketChange ?? 0,
          regularMarketChangePercent: brapiItem.regularMarketChangePercent ?? 0,
          regularMarketOpen: brapiItem.regularMarketOpen ?? brapiItem.regularMarketPrice,
          regularMarketDayHigh: brapiItem.regularMarketDayHigh ?? brapiItem.regularMarketPrice,
          regularMarketDayLow: brapiItem.regularMarketDayLow ?? brapiItem.regularMarketPrice,
          regularMarketVolume: brapiItem.regularMarketVolume ?? null,
          previousClose: brapiItem.regularMarketPrice - (brapiItem.regularMarketChange ?? 0),
          currency: 'BRL',
          updatedAt: new Date().toISOString(),
          updatedAtFormatted: formatBrasiliaTime(),
          isIndex: asset.isIndex,
          status: 'available',
          sparkline: [brapiItem.regularMarketPrice],
          historicalPoints: [
            { time: formatBrasiliaTime().slice(0, 5), price: brapiItem.regularMarketPrice, volume: brapiItem.regularMarketVolume ?? 0 },
          ],
        };
      }
    }

    if (quote && quote.regularMarketPrice !== null) {
      // Manage continuous session history
      const existingHistory = intradayHistoryStore.get(asset.symbol) || [];
      const currentPointTime = formatBrasiliaTime().slice(0, 5);

      if (quote.historicalPoints && quote.historicalPoints.length > 0) {
        intradayHistoryStore.set(asset.symbol, quote.historicalPoints);
      } else {
        // Append point if new minute
        if (existingHistory.length === 0 || existingHistory[existingHistory.length - 1].time !== currentPointTime) {
          existingHistory.push({
            time: currentPointTime,
            price: quote.regularMarketPrice,
            volume: quote.regularMarketVolume ?? 0,
          });
          if (existingHistory.length > 100) existingHistory.shift();
          intradayHistoryStore.set(asset.symbol, existingHistory);
        }
        quote.historicalPoints = existingHistory;
        quote.sparkline = existingHistory.map(p => p.price);
      }

      cachedQuotes.set(asset.symbol, quote);
    } else {
      // If we already have a previous valid quote in cache, preserve it as requested!
      const previous = cachedQuotes.get(asset.symbol);
      if (previous) {
        cachedQuotes.set(asset.symbol, {
          ...previous,
          errorMessage: 'Dados em cache (última cotação válida recebida)',
        });
      } else {
        // Explicitly set unavailable per rule 13: "Dados indisponíveis - Não preencher com zero e não inventar"
        cachedQuotes.set(asset.symbol, {
          symbol: asset.symbol,
          name: asset.name,
          shortName: asset.shortName,
          regularMarketPrice: null,
          regularMarketChange: null,
          regularMarketChangePercent: null,
          regularMarketOpen: null,
          regularMarketDayHigh: null,
          regularMarketDayLow: null,
          regularMarketVolume: null,
          previousClose: null,
          currency: 'BRL',
          updatedAt: new Date().toISOString(),
          updatedAtFormatted: formatBrasiliaTime(),
          isIndex: asset.isIndex,
          status: 'unavailable',
          errorMessage: 'Dados indisponíveis no momento',
        });
      }
    }
  }

  lastFetchTimestamp = Date.now();

  const quotesList = TARGET_ASSETS.map(a => cachedQuotes.get(a.symbol)!);
  const ibovQuote = quotesList.find(q => q.symbol === 'IBOV') || null;
  const stockQuotes = quotesList.filter(q => q.symbol !== 'IBOV');

  return {
    success: true,
    timestamp: new Date().toISOString(),
    brasiliaTime: formatBrasiliaTime(),
    marketStatus,
    ibov: ibovQuote,
    stocks: stockQuotes,
    allQuotes: quotesList,
    source: 'Dados Oficiais de Mercado B3 (Provedor Externo)',
    cached: false,
  };
}

export async function getSingleQuoteHistory(symbol: string, range: string = '1d'): Promise<{
  symbol: string;
  name: string;
  points: Array<{ time: string; price: number; volume?: number; date?: string }>;
  currency: string;
}> {
  const asset = TARGET_ASSETS.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
  if (!asset) {
    throw new Error(`Ativo ${symbol} não encontrado na lista oficial de monitoramento.`);
  }

  // Range options: 1d, 5d, 1mo
  const interval = range === '1d' ? '5m' : (range === '5d' ? '15m' : '1d');
  const symbolsToTry = [asset.yahooSymbol, ...(asset.alternativeSymbols || [])];

  for (const sym of symbolsToTry) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${interval}&range=${range}&includePrePost=true`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        if (result) {
          const timestamps: number[] = result.timestamp || [];
          const quote = result.indicators?.quote?.[0];
          const points: Array<{ time: string; price: number; volume?: number; date?: string }> = [];

          if (quote?.close && timestamps.length > 0) {
            for (let i = 0; i < timestamps.length; i++) {
              const price = quote.close[i];
              if (typeof price === 'number' && !isNaN(price)) {
                const timeDate = new Date(timestamps[i] * 1000);
                const timeStr = timeDate.toLocaleTimeString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateStr = timeDate.toLocaleDateString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  day: '2-digit',
                  month: '2-digit',
                });

                points.push({
                  time: range === '1d' ? timeStr : `${dateStr} ${timeStr}`,
                  date: dateStr,
                  price: Number(price.toFixed(2)),
                  volume: quote.volume?.[i] ?? 0,
                });
              }
            }
          }

          if (points.length > 0) {
            return {
              symbol: asset.symbol,
              name: asset.name,
              points,
              currency: result.meta?.currency || 'BRL',
            };
          }
        }
      }
    } catch {
      // Continue
    }
  }

  // Fallback to in-memory session history
  const sessionPoints = intradayHistoryStore.get(asset.symbol) || [];
  return {
    symbol: asset.symbol,
    name: asset.name,
    points: sessionPoints,
    currency: 'BRL',
  };
}
