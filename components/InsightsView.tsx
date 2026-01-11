import React from 'react';
import { DecisionResult } from '../types';
import clsx from 'clsx';

interface InsightsViewProps {
  result: DecisionResult;
  horizon: number;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const formatDeltaMonth = (val: number) => {
  if (val === 0) return "Keine Änderung";
  if (val < 0) return `${Math.abs(val)} Monate früher`;
  return `${val} Monate später`;
};

export const InsightsView: React.FC<InsightsViewProps> = ({ result, horizon }) => {
  if (!result.primary_lever) {
    return (
      <div className="bg-slate-50 p-6 rounded-lg text-center text-slate-500">
        Keine signifikanten Verbesserungen mit aktuellen Hebeln möglich.
      </div>
    );
  }

  const { primary_lever, secondary_levers, confidence } = result;

  // Static truth sentence based on category
  const getTruth = (cat: string) => {
    switch (cat) {
      case 'product_ops': return "Interne Hebel schlagen in frühen Phasen oft reines externes Wachstum.";
      case 'sales': return "Zeit und Prozess-Ineffizienz sind hier oft teurer als fehlende Leads.";
      case 'marketing': return "Marketing-Skalierung lohnt sich hier, weil die Unit Economics bereits stimmen.";
      case 'unit_economics': return "Pricing und Marge haben den direktesten Einfluss auf das Ergebnis.";
      default: return "";
    }
  };

  return (
    <div className="bg-white border-l-4 border-indigo-500 shadow-sm rounded-r-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">
            Größter wirtschaftlicher Hebel
          </h2>
          <div className="text-2xl font-semibold text-slate-800">
            {primary_lever.def.label}
          </div>
        </div>
        <div className={clsx(
          "mt-2 md:mt-0 px-3 py-1 rounded text-xs font-medium uppercase border",
          confidence === 'hoch' ? "bg-green-50 text-green-700 border-green-200" :
          confidence === 'mittel' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
          "bg-slate-50 text-slate-600 border-slate-200"
        )}>
          Konfidenz: {confidence}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-indigo-50 p-3 rounded">
          <div className="text-xs text-indigo-800 mb-1">Zusätzlicher Deckungsbeitrag</div>
          <div className="text-lg font-bold text-indigo-900">
            {primary_lever.impact.delta_contribution > 0 ? '+' : ''}
            {formatCurrency(primary_lever.impact.delta_contribution)}
          </div>
          <div className="text-[10px] text-indigo-600">über {horizon} Monate</div>
        </div>
        <div className="bg-indigo-50 p-3 rounded">
          <div className="text-xs text-indigo-800 mb-1">Break-Even Impact</div>
          <div className="text-lg font-bold text-indigo-900">
            {formatDeltaMonth(primary_lever.impact.delta_breakeven)}
          </div>
        </div>
        <div className="bg-indigo-50 p-3 rounded">
          <div className="text-xs text-indigo-800 mb-1">Peak Operations Last</div>
          <div className="text-lg font-bold text-indigo-900">
            {Math.round(primary_lever.impact.delta_ops_load)} Std.
          </div>
          <div className="text-[10px] text-indigo-600">vs. Baseline</div>
        </div>
      </div>

      <p className="text-slate-600 italic text-sm border-t border-slate-100 pt-4 mb-4">
        „{getTruth(primary_lever.def.category)}“
      </p>

      {secondary_levers.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500">
          <span className="font-semibold">Auch relevant:</span>
          {secondary_levers.map((l, i) => (
            <span key={i} className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
              {l.def.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
