import React, { useMemo } from 'react';
import { StockQuote } from '../types';
import { Award, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface Props {
  stocks: StockQuote[];
  onSelectStock?: (symbol: string) => void;
}

export const MarketHighlights: React.FC<Props> = ({ stocks, onSelectStock }) => {
  const highlights = useMemo(() => {
    const validStocks = stocks.filter(
      s => s.status === 'available' && s.regularMarketPrice !== null && s.regularMarketChangePercent !== null
    );

    if (validStocks.length === 0) {
      return {
        topGainer: null,
        topLoser: null,
        highestPrice: null,
        highestVolatility: null,
      };
    }

    // Top Gainer (Maior alta %)
    const sortedByGain = [...validStocks].sort(
      (a, b) => (b.regularMarketChangePercent ?? -Infinity) - (a.regularMarketChangePercent ?? -Infinity)
    );
    const topGainer = sortedByGain[0] || null;

    // Top Loser (Maior baixa %)
    const sortedByLoss = [...validStocks].sort(
      (a, b) => (a.regularMarketChangePercent ?? Infinity) - (b.regularMarketChangePercent ?? Infinity)
    );
    const topLoser = sortedByLoss[0] || null;

    // Highest Price (Maior preço R$)
    const sortedByPrice = [...validStocks].sort(
      (a, b) => (b.regularMarketPrice ?? 0) - (a.regularMarketPrice ?? 0)
    );
    const highestPrice = sortedByPrice[0] || null;

    // Highest Volatility / Absolute Change
    const sortedByVol = [...validStocks].sort(
      (a, b) => Math.abs(b.regularMarketChangePercent ?? 0) - Math.abs(a.regularMarketChangePercent ?? 0)
    );
    const highestVolatility = sortedByVol[0] || null;

    return {
      topGainer,
      topLoser,
      highestPrice,
      highestVolatility,
    };
  }, [stocks]);

  const cards = [
    {
      id: 'highlight-maior-alta',
      title: 'Maior Alta',
      emoji: '🏆',
      icon: Award,
      badgeText: 'Top Alta',
      accentColor: 'emerald',
      item: highlights.topGainer,
      valueFormatter: (item: StockQuote) => formatPercent(item.regularMarketChangePercent),
      subValue: (item: StockQuote) => formatCurrency(item.regularMarketPrice),
      isPositive: true,
    },
    {
      id: 'highlight-maior-baixa',
      title: 'Maior Baixa',
      emoji: '📉',
      icon: TrendingDown,
      badgeText: 'Top Baixa',
      accentColor: 'rose',
      item: highlights.topLoser,
      valueFormatter: (item: StockQuote) => formatPercent(item.regularMarketChangePercent),
      subValue: (item: StockQuote) => formatCurrency(item.regularMarketPrice),
      isPositive: false,
    },
    {
      id: 'highlight-maior-preco',
      title: 'Maior Preço',
      emoji: '💰',
      icon: DollarSign,
      badgeText: 'Top Valor',
      accentColor: 'blue',
      item: highlights.highestPrice,
      valueFormatter: (item: StockQuote) => formatCurrency(item.regularMarketPrice),
      subValue: (item: StockQuote) => formatPercent(item.regularMarketChangePercent),
      isPositive: (highlights.highestPrice?.regularMarketChangePercent ?? 0) >= 0,
    },
    {
      id: 'highlight-maior-variacao',
      title: 'Maior Variação',
      emoji: '📊',
      icon: Activity,
      badgeText: 'Volatilidade',
      accentColor: 'purple',
      item: highlights.highestVolatility,
      valueFormatter: (item: StockQuote) => `Δ ${Math.abs(item.regularMarketChangePercent ?? 0).toFixed(2).replace('.', ',')}%`,
      subValue: (item: StockQuote) => formatCurrency(item.regularMarketPrice),
      isPositive: (highlights.highestVolatility?.regularMarketChangePercent ?? 0) >= 0,
    },
  ];

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Destaques do Dia
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            (Cálculo Automático B3)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {cards.map((c) => {
          const item = c.item;
          if (!item) {
            return (
              <div
                key={c.id}
                id={c.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-3 animate-pulse"
              >
                <div className="h-3 w-20 bg-slate-800 rounded mb-2"></div>
                <div className="h-5 w-28 bg-slate-800 rounded"></div>
              </div>
            );
          }

          const isStockPositive = (item.regularMarketChangePercent ?? 0) >= 0;

          return (
            <div
              key={c.id}
              id={c.id}
              onClick={() => onSelectStock && onSelectStock(item.symbol)}
              className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-3 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 font-semibold">
                  <span>{c.emoji}</span>
                  <span className="uppercase">{c.title}</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    c.accentColor === 'emerald'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : c.accentColor === 'rose'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : c.accentColor === 'blue'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {c.badgeText}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                      {item.shortName}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {c.subValue(item)}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div
                    className={`text-xs sm:text-sm font-bold inline-flex items-center gap-0.5 ${
                      isStockPositive ? 'text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {isStockPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{c.valueFormatter(item)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

