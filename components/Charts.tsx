import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SimulationResult } from '../types';

interface ChartsProps {
  baseline: SimulationResult;
  marketing: SimulationResult;
  ops: SimulationResult;
  horizon: number;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 3 }).format(val);

const formatCompact = (val: number) => 
  new Intl.NumberFormat('de-DE', { notation: 'compact', compactDisplay: 'short' }).format(val);

export const Charts: React.FC<ChartsProps> = ({ baseline, marketing, ops, horizon }) => {

  // Prepare Data
  const mrrData = baseline.timeSeries.map((m, i) => ({
    name: `M${m.month}`,
    baseline: m.mrr,
    marketing: marketing.timeSeries[i].mrr,
    ops: ops.timeSeries[i].mrr
  }));

  const contribData = baseline.timeSeries.map((m, i) => ({
    name: `M${m.month}`,
    baseline: m.cumulative_contribution,
    marketing: marketing.timeSeries[i].cumulative_contribution,
    ops: ops.timeSeries[i].cumulative_contribution
  }));

  const opsLoadData = baseline.timeSeries.map((m, i) => ({
    name: `M${m.month}`,
    baseline: m.ops_hours_total,
    marketing: marketing.timeSeries[i].ops_hours_total,
    ops: ops.timeSeries[i].ops_hours_total
  }));

  // Breakdown for the LAST month of baseline
  const lastMonth = baseline.timeSeries[baseline.timeSeries.length - 1];
  const breakdownData = [
    { name: 'Marketing', value: lastMonth.marketing_cost, fill: '#ef4444' }, // red
    { name: 'Sales', value: lastMonth.sales_cost, fill: '#f97316' }, // orange
    { name: 'Ops/Support', value: lastMonth.ops_cost, fill: '#10b981' }, // green
    { name: 'Deckungsbeitrag', value: lastMonth.contribution, fill: '#3b82f6' }, // blue
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* 1. MRR Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">MRR Entwicklung</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mrrData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
              <YAxis tickFormatter={formatCompact} tick={{fontSize: 12}} stroke="#94a3b8" />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend />
              <Line type="monotone" dataKey="baseline" name="Status Quo" stroke="#64748b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="marketing" name="Marketing Fokus" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ops" name="Ops Fokus" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Contribution Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Kumulierter Deckungsbeitrag</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={contribData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
              <YAxis tickFormatter={formatCompact} tick={{fontSize: 12}} stroke="#94a3b8" />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="baseline" name="Status Quo" stroke="#64748b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="marketing" name="Marketing Fokus" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ops" name="Ops Fokus" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Ops Load */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Operative Last (Stunden/Monat)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={opsLoadData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
              <YAxis tickFormatter={formatCompact} tick={{fontSize: 12}} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="baseline" name="Status Quo" stroke="#64748b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="marketing" name="Marketing Fokus" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ops" name="Ops Fokus" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Cost Breakdown (Status Quo Last Month) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Kosten & Beitrag (Status Quo, Monat {horizon})</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdownData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={formatCompact} hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
              <Tooltip formatter={(val: number) => formatCurrency(val)} />
              <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
