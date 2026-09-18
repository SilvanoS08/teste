import React, { useState, useEffect, useMemo } from 'react';
import { StockQuote } from '../types';
import { fetchQuoteHistory } from '../services/marketClient';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Activity, BarChart2, Layers, RefreshCw } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface Props {
  allQuotes: StockQuote[];
  ibov: StockQuote | null;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const ChartsSection: React.FC<Props> = ({
  allQuotes,
  ibov,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'ibov' | 'comparison' | 'single'>('ibov');
  const [selectedRange, setSelectedRange] = useState<'1d' | '5d' | '1mo'>('1d');
  const [singleHistory, setSingleHistory] = useState<Array<{ time: string; price: number; volume?: number }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch individual history when symbol or range changes
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      const res = await fetchQuoteHistory(selectedSymbol, selectedRange);
      if (isMounted) {
        if (res && res.points && res.points.length > 0) {
          setSingleHistory(res.points);
        } else {
          // Fallback to points inside current quote object
          const currentQuote = allQuotes.find(q => q.symbol === selectedSymbol);
          if (currentQuote?.historicalPoints && currentQuote.historicalPoints.length > 0) {
            setSingleHistory(currentQuote.historicalPoints);
          } else if (currentQuote?.regularMarketPrice !== null && currentQuote?.regularMarketPrice !== undefined) {
            setSingleHistory([
              { time: 'Abertura', price: currentQuote.regularMarketOpen ?? currentQuote.regularMarketPrice },
              { time: 'Mínima', price: currentQuote.regularMarketDayLow ?? currentQuote.regularMarketPrice },
              { time: 'Máxima', price: currentQuote.regularMarketDayHigh ?? currentQuote.regularMarketPrice },
              { time: 'Último', price: currentQuote.regularMarketPrice },
            ]);
          } else {
            setSingleHistory([]);
          }
        }
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, selectedRange, allQuotes]);

  // IBOV Chart data
  const ibovChartData = useMemo(() => {
    if (ibov?.historicalPoints && ibov.historicalPoints.length > 0) {
      return ibov.historicalPoints;
    }
    if (ibov?.regularMarketPrice !== null && ibov?.regularMarketPrice !== undefined) {
      return [
        { time: 'Abertura', price: ibov.regularMarketOpen ?? ibov.regularMarketPrice },
        { time: 'Mínima', price: ibov.regularMarketDayLow ?? ibov.regularMarketPrice },
        { time: 'Máxima', price: ibov.regularMarketDayHigh ?? ibov.regularMarketPrice },
        { time: 'Atual', price: ibov.regularMarketPrice },
      ];
    }
    return [];
  }, [ibov]);

  // Comparative variation (%) data for all stocks
  const comparisonData = useMemo(() => {
    return allQuotes
      .filter(q => q.regularMarketChangePercent !== null && q.regularMarketChangePercent !== undefined)
      .map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.name,
        changePercent: q.regularMarketChangePercent!,
        isPositive: q.regularMarketChangePercent! >= 0,
        price: q.regularMarketPrice,
      }))
      .sort((a, b) => b.changePercent - a.changePercent);
  }, [allQuotes]);

  const selectedQuote = allQuotes.find(q => q.symbol === selectedSymbol);
  const isSelectedPositive = (selectedQuote?.regularMarketChangePercent ?? 0) >= 0;

  return (
    <section id="secao-graficos-b3" className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md space-y-3.5">
      
      {/* High Density Header with Terminal Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 pb-2.5 border-b border-slate-800">
        <div>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal Gráfico B3</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Intradiário Ibovespa, comparação percentual e curvas por ativo
          </p>
        </div>

        {/* Tab Buttons in High Density style */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ibov')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'ibov'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>IBOV</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'comparison'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <BarChart2 className="w-3 h-3 text-blue-400" />
            <span>Comparativo (%)</span>
          </button>

          <button
            onClick={() => setActiveTab('single')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'single'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Individual</span>
          </button>
        </div>
      </div>

      {/* TAB 1: IBOV EVOLUTION */}
      {activeTab === 'ibov' && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400 font-mono text-xs sm:text-sm">IBOV — Ibovespa</span>
              <span className="text-slate-500 text-[11px] font-mono">Curva Intradiária</span>
            </div>
            {ibov?.regularMarketPrice && (
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-100 font-bold">
                  {new Intl.NumberFormat('pt-BR').format(ibov.regularMarketPrice)} pts
                </span>
                <span
                  className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    (ibov.regularMarketChangePercent ?? 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {formatPercent(ibov.regularMarketChangePercent)}
                </span>
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            {ibovChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ibovChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ibovGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.8} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} />
                  <YAxis
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderRadius: '6px',
                      border: '1px solid #1e293b',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    formatter={(value: any) => [`${new Intl.NumberFormat('pt-BR').format(value)} pts`, 'Pontuação']}
                    labelFormatter={(label) => `Horário: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#34d399"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#ibovGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                Carregando dados intradiários do Ibovespa...
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPARISON OF PERCENTAGE CHANGE */}
      {activeTab === 'comparison' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Ranking de Performance B3 (% Variação)</span>
            <span className="text-[10px] text-slate-500">Verde: Alta | Vermelho: Baixa</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 15, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.8} />
                <XAxis
                  dataKey="symbol"
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', fontFamily: 'monospace' }}
                  interval={0}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderRadius: '6px',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value: any, name: any, item: any) => [
                    `${formatPercent(value)} (${formatCurrency(item.payload.price)})`,
                    'Variação',
                  ]}
                  labelFormatter={(label) => `Ativo: ${label}`}
                />
                <Bar dataKey="changePercent" radius={[2, 2, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.changePercent >= 0 ? '#34d399' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3: INDIVIDUAL ASSET CHART */}
      {activeTab === 'single' && (
        <div className="space-y-3">
          {/* Asset Selector Pills & Time Range in High Density */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Asset pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              {allQuotes.map((q) => (
                <button
                  key={q.symbol}
                  onClick={() => onSelectSymbol(q.symbol)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedSymbol === q.symbol
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {q.symbol}
                </button>
              ))}
            </div>

            {/* Range selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 shrink-0">
              {(['1d', '5d', '1mo'] as const).map((rng) => (
                <button
                  key={rng}
                  onClick={() => setSelectedRange(rng)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                    selectedRange === rng
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {rng === '1d' ? '1D' : rng === '5d' ? '5D' : '1M'}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Info Header */}
          {selectedQuote && (
            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black font-mono text-slate-100">
                  {selectedQuote.symbol}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                  {selectedQuote.shortName || selectedQuote.name}
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-mono">
                <span className="text-sm font-bold text-slate-100">
                  {selectedQuote.isIndex
                    ? `${new Intl.NumberFormat('pt-BR').format(selectedQuote.regularMarketPrice || 0)} pts`
                    : formatCurrency(selectedQuote.regularMarketPrice)}
                </span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                    isSelectedPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {formatPercent(selectedQuote.regularMarketChangePercent)}
                </span>
              </div>
            </div>
          )}

          {/* Chart Rendering */}
          <div className="h-64 w-full relative">
            {isLoadingHistory && (
              <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center z-10">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
            )}

            {singleHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={singleHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="singleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isSelectedPositive ? '#34d399' : '#f43f5e'} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={isSelectedPositive ? '#34d399' : '#f43f5e'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.8} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} tickLine={false} />
                  <YAxis
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(val) => selectedQuote?.isIndex ? `${(val/1000).toFixed(0)}k` : `R$ ${val.toFixed(2)}`}
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderRadius: '6px',
                      border: '1px solid #1e293b',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    formatter={(value: any) => [
                      selectedQuote?.isIndex ? `${new Intl.NumberFormat('pt-BR').format(value)} pts` : formatCurrency(value),
                      'Preço',
                    ]}
                    labelFormatter={(label) => `Horário: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isSelectedPositive ? '#34d399' : '#f43f5e'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#singleGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                Nenhum dado intradiário disponível para {selectedSymbol} no momento.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
