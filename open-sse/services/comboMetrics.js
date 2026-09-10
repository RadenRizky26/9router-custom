/**
 * Combo Metrics — in-memory tracker for per-combo, per-model request stats.
 * Tracks latency, success/failure rate, and last-used info for auto-scoring.
 */

/** @type {Map<string, ComboMetricsEntry>} */
const store = new Map();

function createModelMetrics() {
  return { requests: 0, successes: 0, failures: 0, totalLatencyMs: 0, lastStatus: null, lastUsedAt: null };
}

function createComboEntry(strategy) {
  return {
    totalRequests: 0, totalSuccesses: 0, totalFailures: 0, totalFallbacks: 0,
    totalLatencyMs: 0, strategy, lastUsedAt: null, byModel: {},
  };
}

/**
 * Record a combo-level request outcome.
 * @param {string} comboName
 * @param {string} model - The model that was attempted
 * @param {boolean} success
 * @param {number} latencyMs
 * @param {string} [strategy]
 * @param {number} [fallbackIndex] - 0 = primary, >0 = fallback
 */
export function recordComboRequest(comboName, model, success, latencyMs, strategy = "fallback", fallbackIndex = 0) {
  if (!comboName || !model) return;
  if (!store.has(comboName)) store.set(comboName, createComboEntry(strategy));
  const entry = store.get(comboName);
  entry.totalRequests++;
  entry.totalLatencyMs += latencyMs;
  entry.lastUsedAt = new Date().toISOString();
  if (success) entry.totalSuccesses++;
  else entry.totalFailures++;
  if (fallbackIndex > 0) entry.totalFallbacks++;

  if (!entry.byModel[model]) entry.byModel[model] = createModelMetrics();
  const m = entry.byModel[model];
  m.requests++;
  m.totalLatencyMs += latencyMs;
  m.lastUsedAt = entry.lastUsedAt;
  if (success) { m.successes++; m.lastStatus = "ok"; }
  else { m.failures++; m.lastStatus = "error"; }
}

/**
 * Get metrics for a combo. Returns null if no data.
 */
export function getComboMetrics(comboName) {
  const entry = store.get(comboName);
  if (!entry) return null;
  const byModel = {};
  for (const [k, v] of Object.entries(entry.byModel)) {
    byModel[k] = {
      ...v,
      avgLatencyMs: v.requests > 0 ? Math.round(v.totalLatencyMs / v.requests) : 0,
      successRate: v.requests > 0 ? v.successes / v.requests : 0,
    };
  }
  return {
    ...entry,
    byModel,
    avgLatencyMs: entry.totalRequests > 0 ? Math.round(entry.totalLatencyMs / entry.totalRequests) : 0,
    successRate: entry.totalRequests > 0 ? entry.totalSuccesses / entry.totalRequests : 0,
    fallbackRate: entry.totalRequests > 0 ? entry.totalFallbacks / entry.totalRequests : 0,
  };
}

/** Get all combos' metrics. */
export function getAllComboMetrics() {
  const result = {};
  for (const [name] of store) result[name] = getComboMetrics(name);
  return result;
}

/**
 * Get model-level metrics across all combos.
 * Used by auto-scoring to rank models by real performance.
 */
export function getModelMetrics(model) {
  let agg = createModelMetrics();
  for (const entry of store.values()) {
    const m = entry.byModel[model];
    if (!m) continue;
    agg.requests += m.requests;
    agg.successes += m.successes;
    agg.failures += m.failures;
    agg.totalLatencyMs += m.totalLatencyMs;
    if (m.lastUsedAt && (!agg.lastUsedAt || m.lastUsedAt > agg.lastUsedAt)) agg.lastUsedAt = m.lastUsedAt;
    agg.lastStatus = m.lastStatus;
  }
  return {
    ...agg,
    avgLatencyMs: agg.requests > 0 ? Math.round(agg.totalLatencyMs / agg.requests) : 0,
    successRate: agg.requests > 0 ? agg.successes / agg.requests : 0,
  };
}

/** Reset all stored metrics. */
export function resetComboMetrics() { store.clear(); }
