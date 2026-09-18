/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuotesResponse, StockQuote, MarketStatusInfo } from './types';
import { fetchMarketQuotes } from './services/marketClient';
import { Header } from './components/Header';
import { IbovCard } from './components/IbovCard';
import { MarketHighlights } from './components/MarketHighlights';
import { StockGrid } from './components/StockGrid';
import { ChartsSection } from './components/ChartsSection';
import { QuotesTable } from './components/QuotesTable';
import { FooterDisclaimer } from './components/FooterDisclaimer';
import { AlertCircle, RefreshCw } from 'lucide-react';

const AUTO_REFRESH_INTERVAL_SECONDS = 300; // 5 minutes

export default function App() {
  const [quotesData, setQuotesData] = useState<QuotesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('PETR4');
  const [countdown, setCountdown] = useState<number>(AUTO_REFRESH_INTERVAL_SECONDS);
  const [statusNotification, setStatusNotification] = useState<{
    type: 'idle' | 'updating' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: '',
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to load quotes
  const loadQuotes = useCallback(async (isManual: boolean = false) => {
    if (isManual) {
      setIsUpdating(true);
      setStatusNotification({
        type: 'updating',
        message: 'Atualizando cotações...',
      });
    }

    try {
      const result = await fetchMarketQuotes(isManual);

      if (result.data) {
        setQuotesData(result.data);
        // Reset countdown timer to 5 minutes on successful fetch
        setCountdown(AUTO_REFRESH_INTERVAL_SECONDS);

        if (isManual || result.isCachedFallback) {
          setStatusNotification({
            type: result.isCachedFallback ? 'error' : 'success',
            message: result.isCachedFallback
              ? (result.error || 'Não foi possível atualizar as cotações. Exibindo última cotação válida.')
              : 'Cotações atualizadas com sucesso.',
          });

          // Auto-hide success message after 4 seconds
          setTimeout(() => {
            setStatusNotification({ type: 'idle', message: '' });
          }, 4000);
        }
      } else {
        setStatusNotification({
          type: 'error',
          message: 'Não foi possível atualizar as cotações.',
        });
      }
    } catch (err) {
      setStatusNotification({
        type: 'error',
        message: 'Não foi possível atualizar as cotações.',
      });
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadQuotes(false);
  }, [loadQuotes]);

  // 1-second interval ticker for countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Timer reached 0 -> Trigger automatic API refresh!
          loadQuotes(false);
          return AUTO_REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadQuotes]);

  const handleManualRefresh = () => {
    loadQuotes(true);
  };

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    const chartElem = document.getElementById('secao-graficos-b3');
    if (chartElem) {
      chartElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const ibov = quotesData?.ibov || null;
  const stocks = quotesData?.stocks || [];
  const allQuotes = quotesData?.allQuotes || [];
  const marketStatus = quotesData?.marketStatus || null;
  const lastUpdatedTime = quotesData?.brasiliaTime || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        marketStatus={marketStatus}
        lastUpdatedTime={lastUpdatedTime}
        countdownSeconds={countdown}
        isUpdating={isUpdating}
        updateStatusMessage={statusNotification}
        onManualRefresh={handleManualRefresh}
      />

      {/* Main Container - High Density Compact Spacing */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        
        {/* Loading Skeleton during initial load */}
        {isLoading && !quotesData ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 font-mono">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Carregando cotações B3...
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Inicializando dados dos 12 ativos monitorados
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Featured IBOV Card (Special highlight per requirement 7) */}
            <IbovCard
              ibov={ibov}
              onOpenChart={() => {
                setSelectedSymbol('IBOV');
                const chartElem = document.getElementById('secao-graficos-b3');
                if (chartElem) chartElem.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Destaques do Mercado (Top Gainer, Top Loser, Highest Price, Highest Volatility) */}
            <MarketHighlights
              stocks={stocks}
              onSelectStock={handleSelectStock}
            />

            {/* Interactive Charts Section (IBOV Evolution, Comparison %, Individual Intraday) */}
            <ChartsSection
              allQuotes={allQuotes}
              ibov={ibov}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => setSelectedSymbol(sym)}
            />

            {/* Responsive Grid of Stock Cards (BBAS3, VALE3, PETR4, etc. - 4 cols desktop, 2 tablet, 1 mobile) */}
            <StockGrid
              stocks={stocks}
              selectedSymbol={selectedSymbol}
              onSelectStock={handleSelectStock}
            />

            {/* Complete Sortable and Filterable Quotes Table */}
            <QuotesTable
              allQuotes={allQuotes}
              selectedSymbol={selectedSymbol}
              onSelectStock={handleSelectStock}
            />
          </>
        )}
      </main>

      {/* Footer & Source Disclaimer */}
      <FooterDisclaimer />
    </div>
  );
}
