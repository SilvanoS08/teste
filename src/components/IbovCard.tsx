import React from 'react';
import { StockQuote } from '../types';
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, Activity } from 'lucide-react';
import { formatPercent, formatVolume } from '../utils/formatters';

interface Props {
  ibov: StockQuote | null;
  onOpenChart?: () => void;
}

export const IbovCard: React.FC<Props> = ({ ibov, onOpenChart }) => {
  if (!ibov) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 animate-pulse">
        <div className="h-4 w-32 bg-slate-800 rounded mb-2"></div>
        <div className="h-8 w-44 bg-slate-800 rounded mb-4"></div>
        <div className="grid grid-cols-4 gap-2">
          <div className="h-8 bg-slate-800 rounded"></div>
          <div className="h-8 bg-slate-800 rounded"></div>
          <div className="h-8 bg-slate-800 rounded"></div>
          <div className="h-8 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  const isUnavailable = ibov.status === 'unavailable' || ibov.regularMarketPrice === null;
  const change = ibov.regularMarketChange ?? 0;
  const changePercent = ibov.regularMarketChangePercent ?? 0;
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isZero = change === 0;

  const pointsFormatted = isUnavailable
    ? 'Dados indisponíveis'
    : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
        ibov.regularMarketPrice!
      );

  const changePointsFormatted = isUnavailable
    ? '—'
    : `${change > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(change)} pts`;

  return (
    <div
      id="card-ibov-destaque"
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md flex flex-col justify-between"
    >
      <div className="flex flex-col justify-between gap-4">
        
        {/* Top bar with Label and Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-wider text-emerald-400 font-mono">
                  IBOV
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                  Ibovespa
                </span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                Índice B3 — Principal Referência de Mercado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Atualizado às <strong className="text-slate-200">{ibov.updatedAtFormatted}</strong></span>
            </span>
            {onOpenChart && (
              <button
                onClick={onOpenChart}
                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/60 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3 h-3" />
                <span>GRÁFICO</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Price & Variation Numbers */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-100">
              {pointsFormatted}
            </span>
            {!isUnavailable && <span className="text-xs text-slate-500 font-mono uppercase">pontos</span>}
          </div>

          {!isUnavailable && (
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                  isPositive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isNegative
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
                {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
                {isZero && <Minus className="w-3.5 h-3.5" />}
                <span>{formatPercent(changePercent)}</span>
              </div>

              <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'}`}>
                {changePointsFormatted}
              </span>
            </div>
          )}
        </div>

        {/* High Density Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/60">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Abertura</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-slate-200 mt-0.5">
              {ibov.regularMarketOpen !== null
                ? `${new Intl.NumberFormat('pt-BR').format(ibov.regularMarketOpen!)} pts`
                : '—'}
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/60">
            <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Máxima do Dia</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400 mt-0.5">
              {ibov.regularMarketDayHigh !== null
                ? `${new Intl.NumberFormat('pt-BR').format(ibov.regularMarketDayHigh!)} pts`
                : '—'}
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/60">
            <div className="text-[9px] font-mono text-rose-400 uppercase tracking-wider">Mínima do Dia</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-rose-400 mt-0.5">
              {ibov.regularMarketDayLow !== null
                ? `${new Intl.NumberFormat('pt-BR').format(ibov.regularMarketDayLow!)} pts`
                : '—'}
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/60">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Volume Financeiro</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-slate-200 mt-0.5">
              {formatVolume(ibov.regularMarketVolume)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

