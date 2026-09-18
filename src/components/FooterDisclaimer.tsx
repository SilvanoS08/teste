import React from 'react';
import { Info, Clock, Layers } from 'lucide-react';

export const FooterDisclaimer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8 mt-8 text-[11px] font-mono text-slate-500">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Prominent External Data Notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[10px] leading-relaxed">
            <span className="text-amber-400 font-bold uppercase">Nota Legal & Dados:</span> As cotações são fornecidas por fontes externas de mercado e podem apresentar atraso (delay padrão de até 15 minutos). Os dados destinam-se exclusivamente para fins informativos e acompanhamento, não constituindo recomendação de investimento.
          </div>
        </div>

        {/* System Details & Operational Notes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Ciclo de Atualização: 5 min</span>
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-400" />
              <span>12 Ativos B3</span>
            </span>
          </div>

          <div>
            Terminal B3 • Horário Oficial de Brasília (UTC-3)
          </div>
        </div>
      </div>
    </footer>
  );
};

