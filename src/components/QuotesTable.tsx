import React, { useState, useMemo } from 'react';
import { StockQuote, TableFilterType, TableSortField, SortOrder } from '../types';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, BarChart2, Table } from 'lucide-react';
import { formatCurrency, formatPercent, formatVolume, formatChangeCurrency } from '../utils/formatters';

interface Props {
  allQuotes: StockQuote[];
  selectedSymbol: string | null;
  onSelectStock: (symbol: string) => void;
}

export const QuotesTable: React.FC<Props> = ({ allQuotes, selectedSymbol, onSelectStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TableFilterType>('all');
  const [sortField, setSortField] = useState<TableSortField>('changePercent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: TableSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedQuotes = useMemo(() => {
    return allQuotes
      .filter((quote) => {
        // Search filter
        const matchSearch =
          quote.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quote.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quote.shortName.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchSearch) return false;

        // Type filter
        const change = quote.regularMarketChangePercent ?? 0;
        if (filterType === 'gainers') return change > 0;
        if (filterType === 'losers') return change < 0;
        if (filterType === 'neutral') return change === 0;
        return true;
      })
      .sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;

        switch (sortField) {
          case 'symbol':
            valA = a.symbol;
            valB = b.symbol;
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          case 'name':
            valA = a.shortName || a.name;
            valB = b.shortName || b.name;
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          case 'price':
            valA = a.regularMarketPrice ?? -Infinity;
            valB = b.regularMarketPrice ?? -Infinity;
            break;
          case 'change':
            valA = a.regularMarketChange ?? -Infinity;
            valB = b.regularMarketChange ?? -Infinity;
            break;
          case 'changePercent':
            valA = a.regularMarketChangePercent ?? -Infinity;
            valB = b.regularMarketChangePercent ?? -Infinity;
            break;
          case 'open':
            valA = a.regularMarketOpen ?? -Infinity;
            valB = b.regularMarketOpen ?? -Infinity;
            break;
          case 'high':
            valA = a.regularMarketDayHigh ?? -Infinity;
            valB = b.regularMarketDayHigh ?? -Infinity;
            break;
          case 'low':
            valA = a.regularMarketDayLow ?? -Infinity;
            valB = b.regularMarketDayLow ?? -Infinity;
            break;
          case 'volume':
            valA = a.regularMarketVolume ?? 0;
            valB = b.regularMarketVolume ?? 0;
            break;
          default:
            valA = a.regularMarketChangePercent ?? 0;
            valB = b.regularMarketChangePercent ?? 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [allQuotes, searchQuery, filterType, sortField, sortOrder]);

  const counts = useMemo(() => {
    return {
      all: allQuotes.length,
      gainers: allQuotes.filter((q) => (q.regularMarketChangePercent ?? 0) > 0).length,
      losers: allQuotes.filter((q) => (q.regularMarketChangePercent ?? 0) < 0).length,
      neutral: allQuotes.filter((q) => (q.regularMarketChangePercent ?? 0) === 0).length,
    };
  }, [allQuotes]);

  const renderSortIcon = (field: TableSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-400" />
    );
  };

  return (
    <section id="tabela-cotacoes-b3" className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md space-y-3">
      
      {/* Title & Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-blue-400" />
            <span>Tabela Operacional B3</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            12 cotações consolidadas com métricas de negociação em tempo real
          </p>
        </div>

        {/* High Density Search Bar */}
        <div className="relative min-w-[220px] sm:min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-pesquisar-ativo"
            type="text"
            placeholder="Filtrar por código ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Filter Tabs and Preset Sorters */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Todos ({counts.all})
          </button>

          <button
            onClick={() => setFilterType('gainers')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'gainers'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-500 hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            <span>Altas ({counts.gainers})</span>
          </button>

          <button
            onClick={() => setFilterType('losers')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'losers'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-500 hover:text-rose-400'
            }`}
          >
            <TrendingDown className="w-2.5 h-2.5 text-rose-400" />
            <span>Baixas ({counts.losers})</span>
          </button>

          <button
            onClick={() => setFilterType('neutral')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'neutral'
                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Minus className="w-2.5 h-2.5 text-slate-500" />
            <span>Estáveis ({counts.neutral})</span>
          </button>
        </div>

        {/* Quick sort buttons */}
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <span className="text-slate-500 hidden sm:inline">Ordenar:</span>
          <button
            onClick={() => {
              setSortField('changePercent');
              setSortOrder('desc');
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-bold cursor-pointer ${
              sortField === 'changePercent' && sortOrder === 'desc'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Maior Alta
          </button>
          <button
            onClick={() => {
              setSortField('changePercent');
              setSortOrder('asc');
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-bold cursor-pointer ${
              sortField === 'changePercent' && sortOrder === 'asc'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Maior Baixa
          </button>
          <button
            onClick={() => {
              setSortField('price');
              setSortOrder('desc');
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-bold cursor-pointer ${
              sortField === 'price'
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Preço
          </button>
          <button
            onClick={() => {
              setSortField('symbol');
              setSortOrder('asc');
            }}
            className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase font-bold cursor-pointer ${
              sortField === 'symbol'
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Código
          </button>
        </div>
      </div>

      {/* Table Container in High Density style */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
            <tr>
              <th
                onClick={() => handleSort('symbol')}
                className="py-2 px-3 cursor-pointer hover:text-slate-200 group"
              >
                <div className="flex items-center gap-1">
                  <span>Ativo</span>
                  {renderSortIcon('symbol')}
                </div>
              </th>

              <th
                onClick={() => handleSort('name')}
                className="py-2 px-3 cursor-pointer hover:text-slate-200 group"
              >
                <div className="flex items-center gap-1">
                  <span>Empresa</span>
                  {renderSortIcon('name')}
                </div>
              </th>

              <th
                onClick={() => handleSort('price')}
                className="py-2 px-3 text-right cursor-pointer hover:text-slate-200 group"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Último</span>
                  {renderSortIcon('price')}
                </div>
              </th>

              <th
                onClick={() => handleSort('change')}
                className="py-2 px-3 text-right cursor-pointer hover:text-slate-200 group"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Var (R$)</span>
                  {renderSortIcon('change')}
                </div>
              </th>

              <th
                onClick={() => handleSort('changePercent')}
                className="py-2 px-3 text-right cursor-pointer hover:text-slate-200 group"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Var (%)</span>
                  {renderSortIcon('changePercent')}
                </div>
              </th>

              <th
                onClick={() => handleSort('open')}
                className="py-2 px-3 text-right cursor-pointer hover:text-slate-200 group hidden sm:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Abertura</span>
                  {renderSortIcon('open')}
                </div>
              </th>

              <th
                onClick={() => handleSort('high')}
                className="py-2 px-3 text-right cursor-pointer hover:text-slate-200 group hidden md:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Máxima</span>
                  {renderSortIcon('high')}
                </div>
              </th>

              <th
                onClick={() => handleSort('low')}
                className="py-2 px-3 text-right cursor-pointer hover:text-slate-200 group hidden md:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Mínima</span>
                  {renderSortIcon('low')}
                </div>
              </th>

              <th
                onClick={() => handleSort('volume')}
                className="py-2 px-3 text-right cursor-pointer hover:text-slate-200 group hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Volume</span>
                  {renderSortIcon('volume')}
                </div>
              </th>

              <th className="py-2 px-3 text-right">Hora</th>
              <th className="py-2 px-2.5 text-center">Gráfico</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
            {filteredAndSortedQuotes.length > 0 ? (
              filteredAndSortedQuotes.map((quote) => {
                const isUnavailable = quote.status === 'unavailable' || quote.regularMarketPrice === null;
                const change = quote.regularMarketChange ?? 0;
                const changePercent = quote.regularMarketChangePercent ?? 0;
                const isPositive = change > 0;
                const isNegative = change < 0;
                const isSelected = selectedSymbol === quote.symbol;

                return (
                  <tr
                    key={quote.symbol}
                    onClick={() => onSelectStock(quote.symbol)}
                    className={`hover:bg-slate-800/80 transition-colors cursor-pointer text-xs ${
                      isSelected ? 'bg-blue-950/40 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    {/* Código */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-100">
                          {quote.symbol}
                        </span>
                        {quote.isIndex && (
                          <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            IBOV
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Empresa */}
                    <td className="py-2 px-3">
                      <div className="font-sans text-slate-300 text-[11px] truncate max-w-[170px]">
                        {quote.shortName || quote.name}
                      </div>
                    </td>

                    {/* Último Preço */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {isUnavailable ? (
                        <span className="text-amber-400 font-medium">Indisp.</span>
                      ) : (
                        <span className="font-mono font-bold text-slate-100">
                          {quote.isIndex ? `${new Intl.NumberFormat('pt-BR').format(quote.regularMarketPrice!)}` : formatCurrency(quote.regularMarketPrice)}
                        </span>
                      )}
                    </td>

                    {/* Variação em R$ */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {isUnavailable ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isPositive
                              ? 'text-emerald-400'
                              : isNegative
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {quote.isIndex ? `${change > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR').format(change)}` : formatChangeCurrency(change)}
                        </span>
                      )}
                    </td>

                    {/* Variação em % */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {isUnavailable ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[11px] font-bold font-mono ${
                            isPositive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isNegative
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isPositive && <TrendingUp className="w-2.5 h-2.5" />}
                          {isNegative && <TrendingDown className="w-2.5 h-2.5" />}
                          {formatPercent(changePercent)}
                        </span>
                      )}
                    </td>

                    {/* Abertura */}
                    <td className="py-2 px-3 text-right font-mono text-slate-400 hidden sm:table-cell whitespace-nowrap text-[11px]">
                      {quote.isIndex ? (quote.regularMarketOpen ? `${new Intl.NumberFormat('pt-BR').format(quote.regularMarketOpen)}` : '—') : formatCurrency(quote.regularMarketOpen)}
                    </td>

                    {/* Máxima */}
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 hidden md:table-cell whitespace-nowrap text-[11px]">
                      {quote.isIndex ? (quote.regularMarketDayHigh ? `${new Intl.NumberFormat('pt-BR').format(quote.regularMarketDayHigh)}` : '—') : formatCurrency(quote.regularMarketDayHigh)}
                    </td>

                    {/* Mínima */}
                    <td className="py-2 px-3 text-right font-mono text-rose-400 hidden md:table-cell whitespace-nowrap text-[11px]">
                      {quote.isIndex ? (quote.regularMarketDayLow ? `${new Intl.NumberFormat('pt-BR').format(quote.regularMarketDayLow)}` : '—') : formatCurrency(quote.regularMarketDayLow)}
                    </td>

                    {/* Volume */}
                    <td className="py-2 px-3 text-right font-mono text-slate-400 hidden lg:table-cell whitespace-nowrap text-[11px]">
                      {formatVolume(quote.regularMarketVolume)}
                    </td>

                    {/* Atualização */}
                    <td className="py-2 px-3 text-right font-mono text-slate-500 whitespace-nowrap text-[10px]">
                      {quote.updatedAtFormatted}
                    </td>

                    {/* Ação / Gráfico */}
                    <td className="py-2 px-2.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock(quote.symbol);
                          const chartElem = document.getElementById('secao-graficos-b3');
                          if (chartElem) chartElem.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title={`Abrir gráfico de ${quote.symbol}`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-6 text-center text-slate-500 font-mono text-xs">
                  Nenhuma cotação encontrada para "{searchQuery}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
