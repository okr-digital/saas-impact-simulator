import React, { useState, useMemo } from 'react';
import { BusinessModelType, BaselineInputs, LeverChange } from './types';
import { PRESETS, DEFAULT_INPUTS_PLG, DEFAULT_INPUTS_SALES, SCENARIO_PRESETS } from './data/presets';
import { applyLevers, simulateBusinessCase } from './utils/model';
import { runDecisionEngine } from './utils/decisionEngine';
import { InputGroup } from './components/InputGroup';
import { Charts } from './components/Charts';
import { InsightsView } from './components/InsightsView';
import clsx from 'clsx';

function App() {
  // --- A) Setup ---
  // Default to the PLG preset
  const defaultPreset = PRESETS.find(p => p.id === 'early_stage_plg');
  
  const [model, setModel] = useState<BusinessModelType>('PLG');
  const [horizon, setHorizon] = useState<number>(12);
  const [presetId, setPresetId] = useState<string>(defaultPreset?.id || '');
  
  // --- B) Baseline Inputs ---
  const [inputs, setInputs] = useState<BaselineInputs>(defaultPreset?.baseline || DEFAULT_INPUTS_PLG);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Helper to update specific input
  const updateInput = (key: keyof BaselineInputs, val: number) => {
    // If user modifies inputs manually, we clear the preset selection visual state (to "Custom")
    // but keep values.
    setPresetId(''); 
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  // Switch Model Handler (Manual Toggle)
  const handleModelChange = (m: BusinessModelType) => {
    setModel(m);
    // When switching model manually, we load the default associated with that model
    // and clear specific preset ID as it's a generic reset.
    setPresetId('');
    setInputs(m === 'PLG' ? DEFAULT_INPUTS_PLG : DEFAULT_INPUTS_SALES);
  };

  // Handle Preset Selection
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setPresetId(newId);

    if (newId === '') {
      // "Kein Preset" selected - usually we just stay with current values
      return;
    }

    const selected = PRESETS.find(p => p.id === newId);
    if (selected) {
      setModel(selected.business_model);
      setInputs(selected.baseline);
    }
  };

  // --- C) Scenario Management ---
  const [marketingLevers, setMarketingLevers] = useState<LeverChange[]>(SCENARIO_PRESETS.marketing.changes);
  const [opsLevers, setOpsLevers] = useState<LeverChange[]>(SCENARIO_PRESETS.ops.changes);

  // --- D) Calculations (Memoized) ---
  const simulationResults = useMemo(() => {
    // 1. Baseline
    const baselineSim = simulateBusinessCase(inputs, model, horizon);

    // 2. Marketing Scenario
    const marketingInputs = applyLevers(inputs, marketingLevers);
    const marketingSim = simulateBusinessCase(marketingInputs, model, horizon);

    // 3. Ops Scenario
    const opsInputs = applyLevers(inputs, opsLevers);
    const opsSim = simulateBusinessCase(opsInputs, model, horizon);

    return { baselineSim, marketingSim, opsSim };
  }, [inputs, model, horizon, marketingLevers, opsLevers]);

  // --- Decision Engine ---
  const decisionResult = useMemo(() => {
    return runDecisionEngine(inputs, model, horizon);
  }, [inputs, model, horizon]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">S</div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-800">SaaS Business Case Simulator</h1>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            v1.1.0 • {model} Model
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top: Insight Engine */}
        <section className="mb-10">
           <InsightsView result={decisionResult} horizon={horizon} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Inputs (Setup & Baseline) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* A) Setup */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 uppercase mb-4 border-b border-slate-100 pb-2">Konfiguration</h2>
              
              {/* Preset Selector */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Preset auswählen</label>
                <select 
                  value={presetId}
                  onChange={handlePresetChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Kein Preset (manuell)</option>
                  {PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                {presetId !== '' && (
                  <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                    {PRESETS.find(p => p.id === presetId)?.description}
                  </p>
                )}
                <p className="text-[10px] text-indigo-500 mt-2 italic border-t border-slate-100 pt-1">
                  Preset dient als realistischer Startpunkt – alle Werte sind frei anpassbar.
                </p>
              </div>

              {/* Business Model Toggle */}
              <label className="text-xs font-semibold text-slate-500 mb-2 block">Geschäftsmodell</label>
              <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                <button 
                  onClick={() => handleModelChange('PLG')}
                  className={clsx("flex-1 py-1.5 text-sm font-medium rounded-md transition-all", model === 'PLG' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700")}
                >
                  PLG (Self-serve)
                </button>
                <button 
                  onClick={() => handleModelChange('SALES_LED')}
                  className={clsx("flex-1 py-1.5 text-sm font-medium rounded-md transition-all", model === 'SALES_LED' ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700")}
                >
                  Sales-led (B2B)
                </button>
              </div>

              {/* Horizon */}
              <div className="mb-2">
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Betrachtungszeitraum</label>
                <div className="flex gap-2">
                  {[6, 12, 18, 24].map(m => (
                    <button 
                      key={m}
                      onClick={() => setHorizon(m)}
                      className={clsx("px-3 py-1 text-xs border rounded", horizon === m ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" : "bg-white border-slate-200 text-slate-600")}
                    >
                      {m} Mon.
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* B) Baseline Inputs */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 uppercase mb-4 border-b border-slate-100 pb-2">
                Ist-Zustand (Baseline)
              </h2>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3">Acquisition</h3>
                <InputGroup 
                  label="Sessions / Monat" 
                  value={inputs.sessions_per_month} 
                  onChange={(v) => updateInput('sessions_per_month', v)} 
                  type="int" 
                  step={100}
                  tooltip="Anzahl der relevanten Website-Besucher oder App-Sessions pro Monat."
                />
                <InputGroup 
                  label="MQL Rate" 
                  value={inputs.mql_rate} 
                  onChange={(v) => updateInput('mql_rate', v)} 
                  type="percent" 
                  tooltip="Conversion Rate: Anteil der Besucher, die zu Leads oder Signups werden (Visitor-to-Lead)."
                />

                <div className="flex justify-between items-center px-1 mb-2 mt-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Kostenmodell
                  </span>
                  <div className="flex bg-slate-100 p-0.5 rounded">
                    <button 
                      onClick={() => {
                        setPresetId('');
                        setInputs(prev => ({ ...prev, use_cost_per_mql: true }));
                      }}
                      className={clsx(
                        "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                        inputs.use_cost_per_mql ? "bg-white shadow-sm text-indigo-600 border border-slate-200" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Var. (CPA)
                    </button>
                    <button 
                      onClick={() => {
                        setPresetId('');
                        setInputs(prev => ({ ...prev, use_cost_per_mql: false }));
                      }}
                      className={clsx(
                        "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                        !inputs.use_cost_per_mql ? "bg-white shadow-sm text-indigo-600 border border-slate-200" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Fix Budget
                    </button>
                  </div>
                </div>

                <InputGroup 
                  label={inputs.use_cost_per_mql ? "Cost per MQL" : "Budget (Monatlich)"} 
                  value={inputs.use_cost_per_mql ? inputs.cost_per_mql : inputs.marketing_spend_fixed} 
                  onChange={(v) => updateInput(inputs.use_cost_per_mql ? 'cost_per_mql' : 'marketing_spend_fixed', v)} 
                  type="currency" 
                  tooltip={inputs.use_cost_per_mql ? "Durchschnittliche Marketingkosten pro generiertem Lead (CPA) inkl. Ad-Spend." : "Fixes monatliches Gesamtbudget für Marketing."}
                />
              </div>

              <div className="space-y-1 mt-6">
                <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3">Conversion</h3>
                {model === 'PLG' ? (
                  <>
                    <InputGroup 
                      label="Activation Rate" 
                      value={inputs.activation_rate} 
                      onChange={(v) => updateInput('activation_rate', v)} 
                      type="percent" 
                      tooltip="Anteil der Signups, die das Produkt erfolgreich einrichten und nutzen ('Aha-Moment')."
                    />
                    <InputGroup 
                      label="Trial to Paid" 
                      value={inputs.trial_to_paid_rate} 
                      onChange={(v) => updateInput('trial_to_paid_rate', v)} 
                      type="percent" 
                      tooltip="Conversion Rate von aktiven Testern zu zahlenden Kunden."
                    />
                  </>
                ) : (
                  <>
                     <InputGroup 
                      label="MQL to SQL" 
                      value={inputs.mql_to_sql_rate} 
                      onChange={(v) => updateInput('mql_to_sql_rate', v)} 
                      type="percent" 
                      tooltip="Qualifizierung: Anteil der Leads, die akzeptiert werden und in die Sales-Pipeline gelangen."
                    />
                    <InputGroup 
                      label="Win Rate (SQL->Cust)" 
                      value={inputs.sql_to_customer_rate} 
                      onChange={(v) => updateInput('sql_to_customer_rate', v)} 
                      type="percent" 
                      tooltip="Closing: Anteil der Opportunities, die erfolgreich zum Abschluss geführt werden."
                    />
                     <InputGroup 
                      label="Sales Cost per SQL" 
                      value={inputs.sales_cost_per_sql} 
                      onChange={(v) => updateInput('sales_cost_per_sql', v)} 
                      type="currency" 
                      tooltip="Variable Vertriebskosten pro Opportunity (z.B. SDR-Zeit, Demos, Pre-Sales Aufwand)."
                    />
                  </>
                )}
              </div>

              <div className="space-y-1 mt-6">
                <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3">Unit Economics</h3>
                <InputGroup 
                  label="ARPA (Monatlich)" 
                  value={inputs.arpa_month} 
                  onChange={(v) => updateInput('arpa_month', v)} 
                  type="currency" 
                  tooltip="Durchschnittlicher Umsatz pro Kunde pro Monat (Average Revenue Per Account)."
                />
                <InputGroup 
                  label="Gross Margin" 
                  value={inputs.gross_margin} 
                  onChange={(v) => updateInput('gross_margin', v)} 
                  type="percent" 
                  tooltip="Bruttomarge: Umsatz minus direkte Kosten (Server, Hosting, Lizenzen). SaaS-Ziel: >80%."
                />
                <InputGroup 
                  label="Logo Churn (mtl.)" 
                  value={inputs.logo_churn_monthly} 
                  onChange={(v) => updateInput('logo_churn_monthly', v)} 
                  type="percent" 
                  tooltip="Monatliche Kündigungsrate (Anzahl Kunden). 1% monatlich ≈ 12% jährlich."
                />
              </div>

              <div className="space-y-1 mt-6">
                <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3">Operations Impact</h3>
                <InputGroup 
                  label="Onboarding Std./Kunde" 
                  value={inputs.onboarding_hours_per_customer} 
                  onChange={(v) => updateInput('onboarding_hours_per_customer', v)} 
                  type="float" 
                  step={0.5}
                  tooltip="Manueller Zeitaufwand für Setup, Training & Onboarding pro Neukunde."
                />
                <InputGroup 
                  label="Support Std./Kunde/Monat" 
                  value={inputs.support_hours_per_customer_month} 
                  onChange={(v) => updateInput('support_hours_per_customer_month', v)} 
                  type="float" 
                  step={0.1}
                  tooltip="Durchschnittlicher laufender Betreuungsaufwand pro Bestandskunde im Monat."
                />
                <InputGroup 
                  label="Interne Kosten / Std." 
                  value={inputs.ops_cost_per_hour} 
                  onChange={(v) => updateInput('ops_cost_per_hour', v)} 
                  type="currency" 
                  tooltip="Kalkulatorischer interner Stundensatz für Ops/Support-Mitarbeiter (Vollkosten)."
                />
              </div>

              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full mt-4 text-xs text-slate-500 hover:text-indigo-600 border-t border-slate-100 pt-3 flex items-center justify-center gap-1"
              >
                {showAdvanced ? 'Weniger anzeigen' : 'Erweiterte Einstellungen'}
              </button>

              {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-3 rounded">
                  <InputGroup 
                    label="Expansion Rate (mtl.)" 
                    value={inputs.expansion_rate_monthly} 
                    onChange={(v) => updateInput('expansion_rate_monthly', v)} 
                    type="percent" 
                    tooltip="Monatliches Umsatzwachstum durch Up-Selling bei Bestandskunden."
                  />
                  {model === 'SALES_LED' && (
                    <InputGroup 
                      label="Sales Cycle (Tage)" 
                      value={inputs.sales_cycle_days} 
                      onChange={(v) => updateInput('sales_cycle_days', v)} 
                      type="int" 
                      tooltip="Durchschnittliche Dauer vom SQL bis zum Vertragsabschluss."
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Results & Visuals */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard 
                label="Total Contribution" 
                value={simulationResults.baselineSim.aggregates.total_contribution} 
                subValue={simulationResults.marketingSim.aggregates.total_contribution}
                type="currency"
                tooltip="Deckungsbeitrag kumuliert über Laufzeit"
              />
              <KPICard 
                label="Ending MRR" 
                value={simulationResults.baselineSim.aggregates.ending_mrr} 
                subValue={simulationResults.marketingSim.aggregates.ending_mrr}
                type="currency"
              />
              <KPICard 
                label="Break-Even (Monat)" 
                value={simulationResults.baselineSim.aggregates.breakeven_month || 'Nie'} 
                subValue={simulationResults.opsSim.aggregates.breakeven_month || 'Nie'}
                type="text"
                highlightBetter
              />
              <KPICard 
                label="Peak Ops Load (Std)" 
                value={Math.round(simulationResults.baselineSim.aggregates.peak_ops_hours)} 
                subValue={Math.round(simulationResults.opsSim.aggregates.peak_ops_hours)}
                type="int"
                invertColor
              />
            </div>

            {/* Charts Section */}
            <Charts 
              baseline={simulationResults.baselineSim} 
              marketing={simulationResults.marketingSim} 
              ops={simulationResults.opsSim} 
              horizon={horizon}
            />

            {/* Scenario Editor (Simplified) */}
            <div className="bg-white rounded-lg p-6 border border-slate-200">
               <h3 className="text-sm font-bold text-slate-800 mb-4">Szenario Definitionen</h3>
               <p className="text-sm text-slate-500 mb-4">
                 Die Simulation vergleicht den Status Quo mit zwei Strategien. Hier können die Annahmen für die Strategien feinjustiert werden.
               </p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Marketing Scenario Inputs */}
                 <div className="border-t-4 border-blue-500 pt-4">
                    <h4 className="font-semibold text-blue-700 text-sm mb-2">Marketing Fokus Anpassungen</h4>
                    <div className="space-y-2 text-sm">
                      {marketingLevers.map((lever, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                          <span className="text-slate-600">{lever.key}</span>
                          <span className="font-mono font-bold">
                             {lever.type === 'multiplier' ? 'x' : (lever.value > 0 ? '+' : '')}{lever.value}
                          </span>
                        </div>
                      ))}
                      <div className="text-xs text-slate-400 italic mt-2">Editierbar in Version 1.1</div>
                    </div>
                 </div>

                 {/* Ops Scenario Inputs */}
                 <div className="border-t-4 border-emerald-500 pt-4">
                    <h4 className="font-semibold text-emerald-700 text-sm mb-2">Ops Fokus Anpassungen</h4>
                    <div className="space-y-2 text-sm">
                      {opsLevers.map((lever, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                          <span className="text-slate-600">{lever.key}</span>
                          <span className="font-mono font-bold">
                             {lever.type === 'multiplier' ? 'x' : (lever.value > 0 ? '+' : '')}{lever.value}
                          </span>
                        </div>
                      ))}
                      <div className="text-xs text-slate-400 italic mt-2">Editierbar in Version 1.1</div>
                    </div>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Simple KPI Card Component
interface KPICardProps {
  label: string;
  value: number | string | null;
  subValue?: number | string | null;
  type?: 'currency' | 'int' | 'text';
  tooltip?: string;
  invertColor?: boolean;
  highlightBetter?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, subValue, type, tooltip, invertColor, highlightBetter }) => {
  const format = (v: number | string | null) => {
    if (v === 'Nie' || v === null) return 'Nie';
    if (typeof v === 'number' && type === 'currency') {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(v);
    }
    return v;
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm border border-slate-100 flex flex-col justify-between" title={tooltip}>
      <div className="text-xs font-semibold text-slate-500 uppercase">{label}</div>
      <div className="text-2xl font-bold text-slate-800 mt-1">{format(value)}</div>
      {subValue && (
        <div className="text-xs text-slate-400 mt-1">
          Szenario: <span className="text-slate-600">{format(subValue)}</span>
        </div>
      )}
    </div>
  );
}

export default App;