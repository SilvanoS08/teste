import React from 'react';
import { StockQuote } from '../types';
import { TrendingUp, TrendingDown, Minus, Clock, BarChart2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatPercent, formatVolume, formatChangeCurrency } from '../utils/formatters';

interface Props {
  quote: StockQuote;
  isSelected?: boolean;
  onSelect?: (symbol: string) => void;
}

export const StockCard: React.FC<Props> = ({ quote, isSelected = false, onSelect }) => {
  const isUnavailable = quote.status === 'unavailable' || quote.regularMarketPrice === null;
  const change = quote.regularMarketChange ?? 0;
  const changePercent = quote.regularMarketChangePercent ?? 0;
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isZero = change === 0;

  const leftBorderColor = isUnavailable
    ? 'border-l-slate-700'
    : isPositive
    ? 'border-l-emerald-500'
    : isNegative
    ? 'border-l-rose-500'
    : 'border-l-slate-600';

  return (
    <div
      id={`stock-card-${quote.symbol.toLowerCase()}`}
      onClick={() => onSelect && onSelect(quote.symbol)}
      className={`group bg-slate-900 border ${
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-500/50'
          : 'border-slate-800 hover:border-slate-700'
      } border-l-4 ${leftBorderColor} p-3 rounded-lg shadow-sm transition-all cursor-pointer flex flex-col justify-between`}
    >
      {/* Header: Symbol, Name and Action Button */}
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-black tracking-wider text-slate-100 group-hover:text-blue-400 transition-colors">
                {quote.symbol}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5" title={quote.name}>
              {quote.shortName || quote.name}
            </p>
          </div>

          {!isUnavailable ? (
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isPositive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isNegative
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {formatPercent(changePercent)}
            </span>
          ) : (
            <span className="text-[9px] font-mono uppercase bg-slate-800 text-slate-400 px-1 py-0.5 rounded">
              Indisponível
            </span>
          )}
        </div>

        {/* Price & Variation Display */}
        <div className="my-1.5 pb-2 border-b border-slate-800/80">
          {isUnavailable ? (
            <div className="py-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800 text-[10px] font-mono">
                <AlertCircle className="w-3 h-3" />
                <span>Dados indisponíveis</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-base sm:text-lg font-black font-mono tracking-tight text-slate-100">
                {formatCurrency(quote.regularMarketPrice)}
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    isPositive
                      ? 'text-emerald-400'
                      : isNegative
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {formatChangeCurrency(change)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Intraday High Density Metrics (Abertura, Máxima, Mínima, Volume) */}
        {!isUnavailable && (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono text-slate-400 pt-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">A:</span>
              <span className="text-slate-300 font-semibold">{formatCurrency(quote.regularMarketOpen)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-emerald-500">M:</span>
              <span className="text-emerald-400 font-semibold">{formatCurrency(quote.regularMarketDayHigh)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-rose-500">Min:</span>
              <span className="text-rose-400 font-semibold">{formatCurrency(quote.regularMarketDayLow)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Vol:</span>
              <span className="text-slate-300 truncate max-w-[55px]" title={formatVolume(quote.regularMarketVolume)}>
                {formatVolume(quote.regularMarketVolume)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Volume & Timestamp */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-slate-600" />
          <span>{quote.updatedAtFormatted || '—'}</span>
        </div>
        <div className="flex items-center gap-0.5 text-slate-400 group-hover:text-blue-400 transition-colors">
          <BarChart2 className="w-2.5 h-2.5" />
          <span className="text-[8px] uppercase">Gráfico</span>
        </div>
      </div>
    </div>
  );
};
