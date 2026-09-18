import React, { useEffect, useState } from 'react';
import { MarketStatusInfo } from '../types';
import { MarketStatusBadge } from './MarketStatusBadge';
import { RefreshCw, Clock, Calendar, Check, AlertTriangle } from 'lucide-react';
import { formatSecondsCountdown } from '../utils/formatters';

interface HeaderProps {
  marketStatus: MarketStatusInfo | null;
  lastUpdatedTime: string | null;
  countdownSeconds: number;
  isUpdating: boolean;
  updateStatusMessage: { type: 'idle' | 'updating' | 'success' | 'error'; message: string };
  onManualRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  lastUpdatedTime,
  countdownSeconds,
  isUpdating,
  updateStatusMessage,
  onManualRefresh,
}) => {
  const [currentClock, setCurrentClock] = useState<{ date: string; time: string }>({
    date: '',
    time: '',
  });

  // Real-time Brasília clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateStr = now.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      setCurrentClock({ date: dateStr, time: timeStr });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & Titles */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent font-mono">
                  DASHBOARD B3
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  Terminal B3
                </span>
                <MarketStatusBadge marketStatus={marketStatus} />
              </div>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                Cotações de Ações da Bolsa em Tempo Real
              </p>
            </div>
          </div>

          {/* High Density Right Controls: Status, Clock, Countdown, Refresh */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-4 pt-1.5 md:pt-0 border-t border-slate-900 md:border-t-0">
            
            {/* Live Brasília Clock & Date */}
            <div className="flex items-center gap-2.5 text-[11px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
              <div className="flex items-center gap-1 text-slate-400 font-mono">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{currentClock.date || '—'}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1 text-slate-200 font-mono font-bold">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{currentClock.time || '—'}</span>
                <span className="text-[9px] text-slate-500 font-normal">BRT</span>
              </div>
            </div>

            {/* Countdown Box */}
            <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-md text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Próxima atualização</p>
              <p className="text-xs font-mono font-bold text-emerald-400">
                {formatSecondsCountdown(countdownSeconds)}
              </p>
            </div>

            {/* Action Button: High Density Blue Button */}
            <button
              id="btn-atualizar-agora"
              onClick={onManualRefresh}
              disabled={isUpdating}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold font-mono tracking-wider uppercase transition-all cursor-pointer shadow-lg shadow-blue-950/40 ${
                isUpdating
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'ATUALIZANDO...' : 'ATUALIZAR AGORA'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Status Toast Banner */}
        {updateStatusMessage.type !== 'idle' && (
          <div
            className={`mt-2 px-3 py-1 rounded text-[11px] font-mono flex items-center justify-between border ${
              updateStatusMessage.type === 'updating'
                ? 'bg-blue-950/60 text-blue-300 border-blue-800/80'
                : updateStatusMessage.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-amber-950/60 text-amber-300 border-amber-800/80'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {updateStatusMessage.type === 'updating' && (
                <div className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
              {updateStatusMessage.type === 'success' && <Check className="w-3 h-3 text-emerald-400" />}
              {updateStatusMessage.type === 'error' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
              <span>{updateStatusMessage.message}</span>
            </div>
            {lastUpdatedTime && (
              <span className="text-[10px] text-slate-400">
                Última consulta: <strong>{lastUpdatedTime}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
