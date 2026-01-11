import { LeverDefinition } from '../types';

export const LEVER_LIBRARY: LeverDefinition[] = [
  // Marketing
  {
    key: 'sessions_per_month',
    label: 'Traffic Steigerung (+15%)',
    category: 'marketing',
    default_step_type: 'multiplier',
    default_step_value: 1.15
  },
  {
    key: 'mql_rate',
    label: 'MQL Conversion Rate (+10%)',
    category: 'marketing',
    default_step_type: 'multiplier',
    default_step_value: 1.10
  },
  {
    key: 'cost_per_mql',
    label: 'CPL Reduktion (-15%)',
    category: 'marketing',
    default_step_type: 'multiplier',
    default_step_value: 0.85
  },
  
  // Sales / Funnel
  {
    key: 'mql_to_sql_rate',
    label: 'Qualifizierungsrate (+10%)',
    category: 'sales',
    default_step_type: 'multiplier',
    default_step_value: 1.10,
    is_sales_led_only: true
  },
  {
    key: 'sql_to_customer_rate',
    label: 'Win Rate (+10%)',
    category: 'sales',
    default_step_type: 'multiplier',
    default_step_value: 1.10,
    is_sales_led_only: true
  },
  {
    key: 'sales_cycle_days',
    label: 'Sales Cycle Verkürzung (-15%)',
    category: 'sales',
    default_step_type: 'multiplier',
    default_step_value: 0.85,
    is_sales_led_only: true
  },
  {
    key: 'activation_rate',
    label: 'Produkt-Aktivierung (+10%)',
    category: 'product_ops',
    default_step_type: 'multiplier',
    default_step_value: 1.10, // PLG Only effectively
  },
  {
    key: 'trial_to_paid_rate',
    label: 'Trial-to-Paid (+10%)',
    category: 'product_ops',
    default_step_type: 'multiplier',
    default_step_value: 1.10, // PLG Only
  },

  // Unit Economics / Operations
  {
    key: 'arpa_month',
    label: 'Pricing Optimierung (+10% ARPA)',
    category: 'unit_economics',
    default_step_type: 'multiplier',
    default_step_value: 1.10
  },
  {
    key: 'logo_churn_monthly',
    label: 'Churn Reduktion (-1% absolut)',
    category: 'product_ops',
    default_step_type: 'delta_abs',
    default_step_value: -0.01
  },
  {
    key: 'onboarding_hours_per_customer',
    label: 'Onboarding Automatisierung (-30% Std.)',
    category: 'product_ops',
    default_step_type: 'multiplier',
    default_step_value: 0.70
  },
  {
    key: 'support_hours_per_customer_month',
    label: 'Support Effizienz (-20% Std.)',
    category: 'product_ops',
    default_step_type: 'multiplier',
    default_step_value: 0.80
  },
  {
    key: 'expansion_rate_monthly',
    label: 'Expansion Revenue (+0.5% M/o/M)',
    category: 'unit_economics',
    default_step_type: 'delta_abs',
    default_step_value: 0.005
  }
];
