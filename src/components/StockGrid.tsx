import React from 'react';
import { StockQuote } from '../types';
import { StockCard } from './StockCard';
import { Layers } from 'lucide-react';

interface Props {
  stocks: StockQuote[];
  selectedSymbol: string | null;
  onSelectStock: (symbol: string) => void;
}

export const StockGrid: React.FC<Props> = ({ stocks, selectedSymbol, onSelectStock }) => {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Ações Monitoradas B3
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
            {stocks.length} ativos
          </span>
        </div>
      </div>

      {/* High Density Grid: 1 col on mobile, 2 col on tablet, 4 col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {stocks.map((quote) => (
          <StockCard
            key={quote.symbol}
            quote={quote}
            isSelected={selectedSymbol === quote.symbol}
            onSelect={onSelectStock}
          />
        ))}
      </div>
    </section>
  );
};

