import { BaselineInputs, BusinessModelType, DecisionResult, LeverDefinition } from '../types';
import { simulateBusinessCase, applyLevers } from './model';
import { LEVER_LIBRARY } from '../data/levers';

const normalize = (val: number, min: number, max: number): number => {
  if (max === min) return 0;
  return (val - min) / (max - min);
};

export const runDecisionEngine = (
  baselineInputs: BaselineInputs,
  model: BusinessModelType,
  horizonMonths: number
): DecisionResult => {
  // 1. Run Baseline
  const baselineSim = simulateBusinessCase(baselineInputs, model, horizonMonths);

  // 2. Iterate Levers
  const scores: { def: LeverDefinition, raw_impact: any, score: number }[] = [];
  
  // Filter levers irrelevant to model
  const activeLevers = LEVER_LIBRARY.filter(l => {
    if (model === 'PLG' && l.is_sales_led_only) return false;
    if (model === 'SALES_LED' && (l.key === 'activation_rate' || l.key === 'trial_to_paid_rate')) return false;
    return true;
  });

  activeLevers.forEach(lever => {
    // Create inputs with this single lever applied
    const leverInputs = applyLevers(baselineInputs, [{
      key: lever.key,
      type: lever.default_step_type,
      value: lever.default_step_value
    }]);

    const sim = simulateBusinessCase(leverInputs, model, horizonMonths);

    // Calculate Deltas
    const delta_contribution = sim.aggregates.total_contribution - baselineSim.aggregates.total_contribution;
    
    // Breakeven delta: Positive is bad (later), Negative is good (earlier).
    // If baseline never breaks even (null) and sim does (number), that's huge.
    // If both null, 0. If baseline breaks even and sim doesn't, that's bad.
    let delta_breakeven = 0;
    const baseBE = baselineSim.aggregates.breakeven_month || horizonMonths + 1;
    const simBE = sim.aggregates.breakeven_month || horizonMonths + 1;
    delta_breakeven = simBE - baseBE; 

    // Ops Load delta: Negative is good (less work), Positive is bad.
    const delta_ops_load = sim.aggregates.peak_ops_hours - baselineSim.aggregates.peak_ops_hours;

    scores.push({
      def: lever,
      raw_impact: {
        delta_contribution,
        delta_breakeven,
        delta_ops_load
      },
      score: 0 // to be calc
    });
  });

  // 3. Normalize & Score
  // Find ranges for normalization
  const contributions = scores.map(s => s.raw_impact.delta_contribution);
  const breakevens = scores.map(s => s.raw_impact.delta_breakeven); // usually negative is good
  const opsLoads = scores.map(s => s.raw_impact.delta_ops_load); // usually negative is good

  const maxContrib = Math.max(...contributions, 0.1); // avoid div 0
  const minContrib = Math.min(...contributions);
  
  const maxBE = Math.max(...breakevens);
  const minBE = Math.min(...breakevens);

  const maxOps = Math.max(...opsLoads);
  const minOps = Math.min(...opsLoads);

  scores.forEach(s => {
    const econ_score = normalize(s.raw_impact.delta_contribution, minContrib, maxContrib);
    // Invert BE: Lower (more negative) is better. So if val is minBE (e.g. -5), score should be 1.
    // standard norm: (val - min) / (max - min). If val = min, 0. If val = max, 1.
    // We want reverse. 1 - norm.
    const time_score = 1 - normalize(s.raw_impact.delta_breakeven, minBE, maxBE);
    
    // Invert Ops: Lower is better.
    const ops_score = 1 - normalize(s.raw_impact.delta_ops_load, minOps, maxOps);

    let scaling_score = 0.5;
    switch(s.def.category) {
      case 'product_ops': scaling_score = 1.0; break;
      case 'sales': scaling_score = 0.7; break;
      case 'unit_economics': scaling_score = 0.6; break;
      case 'marketing': scaling_score = 0.4; break;
    }

    // Weighting: Econ 40%, Time 25%, Ops 20%, Scaling 15%
    s.score = (econ_score * 0.4) + (time_score * 0.25) + (ops_score * 0.20) + (scaling_score * 0.15);
  });

  // 4. Selection & Guardrails
  scores.sort((a, b) => b.score - a.score);

  let winner = scores[0];

  // Guardrail: If Marketing wins, but Product/Ops is close (>= 85%), prefer Ops.
  if (winner.def.category === 'marketing') {
    const bestOps = scores.find(s => s.def.category === 'product_ops');
    if (bestOps && bestOps.score >= (winner.score * 0.85)) {
      winner = bestOps;
    }
  }

  // Confidence
  const top1 = scores[0];
  const top2 = scores[1];
  let confidence: 'hoch' | 'mittel' | 'niedrig' = 'niedrig';
  let marketing_win_but_ops_close = false;

  if (top1 && top2) {
    const diff = (top1.score - top2.score) / top1.score;
    if (diff > 0.15) confidence = 'hoch';
    else if (diff > 0.05) confidence = 'mittel';
  }

  // Construct Output
  const result: DecisionResult = {
    primary_lever: winner ? {
      def: winner.def,
      impact: winner.raw_impact,
      score: winner.score
    } : null,
    secondary_levers: scores.slice(1, 4).map((s, idx) => ({ def: s.def, rank: idx + 2 })),
    confidence,
    marketing_win_but_ops_close
  };

  return result;
};
