import { BaselineInputs, PresetOption, ScenarioDefinition } from '../types';

export const PRESETS: PresetOption[] = [
  {
    id: 'early_stage_plg',
    label: 'Early-Stage PLG SaaS (DACH)',
    description: 'Typisches Self-serve SaaS mit Fokus auf Produkt & Retention',
    business_model: 'PLG',
    baseline: {
      sessions_per_month: 8000,
      mql_rate: 0.03,
      cost_per_mql: 22,
      marketing_spend_fixed: 0,
      use_cost_per_mql: true,
      
      activation_rate: 0.35,
      trial_to_paid_rate: 0.12,
      
      // Unused in PLG
      mql_to_sql_rate: 0,
      sql_to_customer_rate: 0,
      sales_cycle_days: 0,
      sales_cost_per_sql: 0,

      arpa_month: 90,
      payment_terms_days: 0,
      logo_churn_monthly: 0.04,
      expansion_rate_monthly: 0.005,
      gross_margin: 0.82,

      onboarding_hours_per_customer: 1.8,
      support_hours_per_customer_month: 0.35,
      hours_per_fte_month: 140,
      ops_cost_per_hour: 38
    }
  },
  {
    id: 'early_stage_sales_led',
    label: 'Early-Stage Sales-led SaaS (DACH)',
    description: 'B2B SaaS mit Demo-Sales, wenig Automatisierung',
    business_model: 'SALES_LED',
    baseline: {
      sessions_per_month: 5000,
      mql_rate: 0.02,
      cost_per_mql: 45,
      marketing_spend_fixed: 0,
      use_cost_per_mql: true,

      // Unused in Sales-led
      activation_rate: 0,
      trial_to_paid_rate: 0,

      mql_to_sql_rate: 0.28,
      sql_to_customer_rate: 0.18,
      sales_cycle_days: 45,
      sales_cost_per_sql: 35,

      arpa_month: 280,
      payment_terms_days: 30,
      logo_churn_monthly: 0.025,
      expansion_rate_monthly: 0.01,
      gross_margin: 0.78,

      onboarding_hours_per_customer: 3.2,
      support_hours_per_customer_month: 0.25,
      hours_per_fte_month: 140,
      ops_cost_per_hour: 42
    }
  }
];

// Backwards compatibility / fallbacks (referencing the presets now)
export const DEFAULT_INPUTS_PLG: BaselineInputs = PRESETS.find(p => p.id === 'early_stage_plg')!.baseline;
export const DEFAULT_INPUTS_SALES: BaselineInputs = PRESETS.find(p => p.id === 'early_stage_sales_led')!.baseline;

export const SCENARIO_PRESETS: { marketing: ScenarioDefinition, ops: ScenarioDefinition } = {
  marketing: {
    id: 'marketing_focus',
    name: 'Marketing Fokus',
    color: '#3b82f6', // blue-500
    changes: [
      { key: 'sessions_per_month', type: 'multiplier', value: 1.10 },
      { key: 'mql_rate', type: 'multiplier', value: 1.10 },
      { key: 'cost_per_mql', type: 'multiplier', value: 0.90 },
    ]
  },
  ops: {
    id: 'ops_focus',
    name: 'Operativer Fokus',
    color: '#10b981', // emerald-500
    changes: [
      { key: 'logo_churn_monthly', type: 'delta_abs', value: -0.005 }, // -0.5%
      { key: 'onboarding_hours_per_customer', type: 'multiplier', value: 0.75 },
      { key: 'support_hours_per_customer_month', type: 'multiplier', value: 0.85 },
    ]
  }
};