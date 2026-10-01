export const evaluationCategories = Object.freeze(["Powerful", "Versatile", "Lightweight"]);
export const evaluationEfforts = Object.freeze(["none", "minimal", "low", "medium", "high", "xhigh", "max"]);
export const sampleWorkload = Object.freeze({
  uncachedInputTokens: 384,
  cachedInputTokens: 22495,
  cacheWriteTokens: 27619,
  outputTokens: 201
});

export function evaluateModels(modelPricing, modelBenchmarks, {
  category,
  effort,
  workload,
  qualityFloor = 0.85
}) {
  if (!evaluationCategories.includes(category) || !evaluationEfforts.includes(effort)) {
    throw new Error("Select a valid capability category and reasoning effort.");
  }
  if (!Number.isFinite(qualityFloor) || qualityFloor <= 0 || qualityFloor > 1) {
    throw new Error("The capability floor must be greater than 0 and at most 100%.");
  }
  for (const bucket of Object.keys(sampleWorkload)) {
    if (!Number.isSafeInteger(workload?.[bucket]) || workload[bucket] < 0) {
      throw new Error("Workload token quantities must be non-negative safe integers.");
    }
  }
  const contextTokens = workload.uncachedInputTokens + workload.cachedInputTokens + workload.cacheWriteTokens;
  if (!Number.isSafeInteger(contextTokens) || !Number.isSafeInteger(contextTokens + workload.outputTokens)) {
    throw new Error("The workload token total is too large.");
  }
  if (contextTokens + workload.outputTokens === 0) {
    throw new Error("Enter at least one workload token to calculate value.");
  }

  const rows = modelPricing.filter((item) => item.category === category).map((item) => {
    const rates = item.longContext && contextTokens > item.longContext.thresholdInputTokens
      ? item.longContext
      : item;
    for (const bucket of ["inputPerMillionUsd", "cachedInputPerMillionUsd", "outputPerMillionUsd"]) {
      if (!Number.isFinite(rates[bucket]) || rates[bucket] < 0) {
        throw new Error(`Invalid ${bucket} price for ${item.model}.`);
      }
    }
    const writeRate = rates.cacheWritePerMillionUsd ?? rates.inputPerMillionUsd;
    if (!Number.isFinite(writeRate) || writeRate < 0) {
      throw new Error(`Invalid cache-write price for ${item.model}.`);
    }
    // For models without a separate write price, these prompt tokens use the input price.
    const workloadCostUsd = (
      workload.uncachedInputTokens * rates.inputPerMillionUsd
      + workload.cachedInputTokens * rates.cachedInputPerMillionUsd
      + workload.cacheWriteTokens * writeRate
      + workload.outputTokens * rates.outputPerMillionUsd
    ) / 1_000_000;
    const benchmark = modelBenchmarks?.[item.model];
    const score = benchmark?.scores?.[effort];
    const hasScore = Number.isFinite(score) && score > 0;
    const qualified = benchmark?.qualifiedEfforts?.includes(effort) === true;
    return {
      model: item.model,
      category,
      effort,
      score: hasScore ? score : undefined,
      configuration: benchmark?.configuration,
      unspecifiedEffortScore: benchmark?.unspecifiedEffortScore,
      workloadCostUsd,
      rateTier: rates === item ? "Default" : "Long context",
      status: !hasScore ? "missing-benchmark" : qualified ? "qualified-benchmark" : "scored"
    };
  });
  const scored = rows.filter((row) => row.status === "scored");
  const bestScore = scored.length ? Math.max(...scored.map((row) => row.score)) : undefined;
  for (const row of scored) {
    row.relativeCapability = row.score / bestScore;
    row.status = row.relativeCapability >= qualityFloor ? "eligible" : "below-floor";
  }
  const eligible = rows.filter((row) => row.status === "eligible");
  if (eligible.some((row) => row.workloadCostUsd <= 0)) {
    throw new Error("Value is undefined for a zero-cost eligible workload.");
  }
  const lowestEligibleCostUsd = eligible.length
    ? Math.min(...eligible.map((row) => row.workloadCostUsd))
    : undefined;
  for (const row of eligible) {
    row.value = row.relativeCapability ** 2 / (row.workloadCostUsd / lowestEligibleCostUsd);
  }
  const bestValue = eligible.length ? Math.max(...eligible.map((row) => row.value)) : undefined;
  for (const row of rows) {
    row.recommended = row.value !== undefined && Math.abs(row.value - bestValue) <= 1e-12;
  }
  rows.sort((left, right) => (right.value ?? -1) - (left.value ?? -1)
    || (right.score ?? -1) - (left.score ?? -1)
    || left.model.localeCompare(right.model));
  return {
    rows,
    bestScore,
    lowestEligibleCostUsd,
    scoredCount: scored.length,
    eligibleCount: eligible.length,
    contextTokens,
    recommendations: rows.filter((row) => row.recommended).map((row) => row.model)
  };
}
