import { BaselineInputs, BusinessModelType, LeverChange, SimulationResult, SimulationMonth } from '../types';

export const applyLevers = (base: BaselineInputs, changes: LeverChange[]): BaselineInputs => {
  const result = { ...base };
  changes.forEach(change => {
    const val = result[change.key];
    if (typeof val === 'number') {
      if (change.type === 'multiplier') {
        // @ts-ignore - dynamic key access safe due to numeric check
        result[change.key] = val * change.value;
      } else if (change.type === 'delta_abs') {
        // @ts-ignore
        result[change.key] = val + change.value;
      }
    }
  });
  
  // Guardrails for percentages 0-1
  const percentageKeys = [
    'mql_rate', 'mql_to_sql_rate', 'sql_to_customer_rate', 
    'activation_rate', 'trial_to_paid_rate', 'logo_churn_monthly', 
    'gross_margin', 'expansion_rate_monthly'
  ] as const;

  percentageKeys.forEach(k => {
    if (result[k] < 0) result[k] = 0;
    if (result[k] > 1) result[k] = 1;
  });

  return result;
};

export const simulateBusinessCase = (
  inputs: BaselineInputs,
  model: BusinessModelType,
  horizonMonths: number
): SimulationResult => {
  const timeSeries: SimulationMonth[] = [];
  
  // Initial state placeholders
  let current_customers = 0;
  let cumulative_contribution = 0;
  let mrr_last = 0;

  for (let t = 1; t <= horizonMonths; t++) {
    // 1. Acquisition
    const sessions = inputs.sessions_per_month;
    const mql = sessions * inputs.mql_rate;

    // 2. Qualified & Converted
    let new_customers = 0;
    let sql = 0;
    let sales_cost_variable = 0;

    if (model === 'SALES_LED') {
      sql = mql * inputs.mql_to_sql_rate;
      new_customers = sql * inputs.sql_to_customer_rate;
      sales_cost_variable = sql * inputs.sales_cost_per_sql;
    } else {
      // PLG
      // Mapping: Activation ~ SQL, Trial-to-Paid ~ Win Rate
      sql = mql * inputs.activation_rate; 
      new_customers = sql * inputs.trial_to_paid_rate;
      sales_cost_variable = 0; // Assuming 0 sales cost for PLG MVP
    }

    // 3. Retention & MRR
    // New Customers add to MRR immediately in this simplified model
    // Existing customers churn
    const churned_customers = current_customers * inputs.logo_churn_monthly;
    const retained_customers = current_customers - churned_customers;
    
    // Total Customers at end of period
    const total_customers = retained_customers + new_customers;

    // Revenue
    // Base MRR
    let mrr = total_customers * inputs.arpa_month;
    // Expansion (applied to retained cohort from previous month)
    const expansion_revenue = (retained_customers * inputs.arpa_month) * inputs.expansion_rate_monthly;
    mrr += expansion_revenue;

    // 4. Gross Profit
    const gross_profit = mrr * inputs.gross_margin;

    // 5. Costs
    let marketing_cost = 0;
    if (inputs.use_cost_per_mql) {
      marketing_cost = mql * inputs.cost_per_mql;
    } else {
      marketing_cost = inputs.marketing_spend_fixed;
    }

    // Operations
    const onboarding_hours = new_customers * inputs.onboarding_hours_per_customer;
    const support_hours = total_customers * inputs.support_hours_per_customer_month;
    const ops_hours_total = onboarding_hours + support_hours;
    const ops_cost = ops_hours_total * inputs.ops_cost_per_hour;

    // 6. Contribution
    // Contribution = GP - Marketing - Sales - Ops
    const contribution = gross_profit - marketing_cost - sales_cost_variable - ops_cost;
    cumulative_contribution += contribution;

    timeSeries.push({
      month: t,
      new_customers,
      total_customers,
      mrr,
      gross_profit,
      marketing_cost,
      sales_cost: sales_cost_variable,
      ops_cost,
      contribution,
      cumulative_contribution,
      ops_hours_total
    });

    // Update for next iteration
    current_customers = total_customers;
    mrr_last = mrr;
  }

  // Aggregates
  const total_contribution = timeSeries.reduce((acc, m) => acc + m.contribution, 0);
  const peak_ops_hours = Math.max(...timeSeries.map(m => m.ops_hours_total));
  
  // Find breakeven month (first month where cumulative >= 0)
  // Or simpler for this generic simulator: First month where contribution > 0 implies operational profitability
  // But standard business case usually looks for cumulative payback.
  // Let's use Cumulative > 0 as "Break Even Point" for the project period.
  const be_month_obj = timeSeries.find(m => m.cumulative_contribution >= 0);
  const breakeven_month = be_month_obj ? be_month_obj.month : null;

  return {
    timeSeries,
    aggregates: {
      ending_mrr: mrr_last,
      total_contribution,
      peak_ops_hours,
      breakeven_month
    }
  };
};