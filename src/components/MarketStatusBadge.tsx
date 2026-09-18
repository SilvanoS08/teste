import React from 'react';
import { MarketStatusInfo } from '../types';

interface Props {
  marketStatus: MarketStatusInfo | null;
}

export const MarketStatusBadge: React.FC<Props> = ({ marketStatus }) => {
  if (!marketStatus) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
        <span>Verificando...</span>
      </div>
    );
  }

  const { label, sublabel, color } = marketStatus;

  const colorStyles = {
    green: {
      bg: 'bg-slate-900 border-slate-800 text-emerald-400',
      dot: 'bg-emerald-500 animate-pulse',
    },
    red: {
      bg: 'bg-slate-900 border-slate-800 text-rose-400',
      dot: 'bg-rose-500',
    },
    yellow: {
      bg: 'bg-slate-900 border-slate-800 text-amber-400',
      dot: 'bg-amber-500 animate-ping',
    },
  }[color];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wider font-bold shadow-xs ${colorStyles.bg}`}
      title={sublabel}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${colorStyles.dot}`}></span>
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${color === 'green' ? 'bg-emerald-500' : color === 'red' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
      </span>
      <span>{label}</span>
      <span className="text-[9px] text-slate-500 font-normal hidden lg:inline">({sublabel.split('—')[0].trim()})</span>
    </div>
  );
};

