export type BusinessModelType = 'PLG' | 'SALES_LED';

export interface BaselineInputs {
  // Acquisition
  sessions_per_month: number;
  mql_rate: number; // 0-1
  cost_per_mql: number;
  marketing_spend_fixed: number; // Alternative if cost_per_mql is disabled
  use_cost_per_mql: boolean;

  // Conversion (Shared keys, semantic meaning changes based on Model)
  // Sales-Led specific
  mql_to_sql_rate: number; // 0-1
  sql_to_customer_rate: number; // 0-1
  sales_cycle_days: number;
  sales_cost_per_sql: number;
  
  // PLG specific
  activation_rate: number; // 0-1 (treated as SQL equivalent layer)
  trial_to_paid_rate: number; // 0-1 (treated as Customer equivalent layer)

  // Monetization & Retention
  arpa_month: number;
  logo_churn_monthly: number; // 0-1
  gross_margin: number; // 0-1
  expansion_rate_monthly: number; // 0-1 (Advanced)

  // Operations
  onboarding_hours_per_customer: number;
  support_hours_per_customer_month: number;
  ops_cost_per_hour: number;
}

export type LeverType = 'multiplier' | 'delta_abs';

export interface LeverChange {
  key: keyof BaselineInputs;
  type: LeverType;
  value: number; // e.g. 1.10 or -0.01
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  color: string;
  changes: LeverChange[];
}

export interface PresetOption {
  id: string;
  label: string;
  description: string;
  business_model: BusinessModelType;
  baseline: BaselineInputs;
}

export interface SimulationMonth {
  month: number;
  new_customers: number;
  total_customers: number;
  mrr: number;
  gross_profit: number;
  marketing_cost: number;
  sales_cost: number;
  ops_cost: number;
  contribution: number;
  cumulative_contribution: number;
  ops_hours_total: number;
}

export interface SimulationResult {
  timeSeries: SimulationMonth[];
  aggregates: {
    ending_mrr: number;
    total_contribution: number;
    peak_ops_hours: number;
    breakeven_month: number | null; // null if never
  };
}

export interface LeverDefinition {
  key: keyof BaselineInputs;
  label: string;
  category: 'marketing' | 'sales' | 'product_ops' | 'unit_economics';
  default_step_type: LeverType;
  default_step_value: number; // The step size for the decision engine
  is_sales_led_only?: boolean;
}

export interface DecisionResult {
  primary_lever: {
    def: LeverDefinition;
    impact: {
      delta_contribution: number;
      delta_breakeven: number;
      delta_ops_load: number;
    };
    score: number;
  } | null;
  secondary_levers: Array<{ def: LeverDefinition; rank: number }>;
  confidence: 'hoch' | 'mittel' | 'niedrig';
  marketing_win_but_ops_close: boolean;
}