import assert from "node:assert/strict";
import test from "node:test";
import { calculateSessionCost } from "../src/core/calculate.js";
import { benchmarkSource, modelBenchmarks } from "../src/core/benchmarks.js";
import { modelAliases, modelMetadata, publishedPricingModels, usageBasedRates } from "../src/core/rates.js";
import {
  evaluateModels, evaluationCategories, evaluationEfforts, sampleWorkload
} from "../.github/extensions/copilot-cli-cost/content/model-evaluation.js";

const pricing = publishedPricingModels.map((model) => ({
  model, ...modelMetadata[model], ...usageBasedRates[model],
  // The panel omits a separate write price when GitHub lists it as not applicable.
  cacheWritePerMillionUsd: usageBasedRates[model].cacheWritePerMillionUsd || undefined
}));

function evaluate(overrides = {}) {
  return evaluateModels(pricing, modelBenchmarks, {
    category: "Powerful", effort: "max", workload: { ...sampleWorkload }, ...overrides
  });
}

test("selects GPT-6.1 Sol Max with the exact quality-gated value formula", () => {
  const result = evaluate();
  const sol = result.rows.find((row) => row.model === "gpt-6.1-sol");
  const opus = result.rows.find((row) => row.model === "claude-opus-5.5");
  assert.deepEqual(result.recommendations, ["gpt-6.1-sol"]);
  assert.equal(result.bestScore, 58);
  assert.ok(Math.abs(sol.workloadCostUsd - 0.074075) < 1e-12);
  assert.ok(Math.abs(opus.workloadCostUsd - 0.14815) < 1e-12);
  assert.ok(Math.abs(sol.value - (52 / 58) ** 2) < 1e-12);
  assert.equal(opus.value, 0.5);
  assert.equal(result.rows.find((row) => row.model === "gpt-6-sol").status, "below-floor");
  assert.equal(result.rows.find((row) => row.model === "gpt-6-sol").value, undefined);
});

test("keeps category and effort comparisons separate", () => {
  assert.deepEqual(evaluate({ category: "Versatile", effort: "high" }).recommendations, ["gemini-3.8-flash"]);
  assert.deepEqual(evaluate({ category: "Versatile", effort: "xhigh" }).recommendations, ["claude-sonnet-5.5"]);
  assert.deepEqual(evaluate({ category: "Versatile", effort: "max" }).recommendations, ["claude-sonnet-5.5"]);
  const lightweight = evaluate({ category: "Lightweight" });
  assert.equal(lightweight.scoredCount, 1);
  assert.equal(lightweight.rows.find((row) => row.model === "gpt-6-luna").value, 1);
  for (const category of evaluationCategories) {
    for (const effort of evaluationEfforts) {
      const result = evaluate({ category, effort });
      assert.ok(result.rows.every((row) => row.category === category && row.effort === effort));
      assert.ok(result.rows.every((row) => row.value === undefined || Number.isFinite(row.value)));
    }
  }
});

test("never imputes minimal, unspecified, missing or qualified benchmark scores", () => {
  const minimal = evaluate({ effort: "minimal" });
  assert.equal(minimal.scoredCount, 0);
  assert.deepEqual(minimal.recommendations, []);
  assert.ok(minimal.rows.every((row) => row.value === undefined));
  const codex = evaluate({ effort: "xhigh" }).rows.find((row) => row.model === "gpt-5.3-codex");
  assert.equal(codex.score, 33);
  assert.equal(codex.status, "qualified-benchmark");
  assert.equal(codex.value, undefined);
  const kimi = evaluate({ category: "Versatile" }).rows.find((row) => row.model === "kimi-k2.7-code");
  assert.equal(kimi.score, undefined);
  assert.equal(kimi.unspecifiedEffortScore, 26);
  assert.equal(kimi.value, undefined);
  assert.equal(evaluate({ effort: "none" }).rows.find((row) => row.model === "gpt-6-sol").score, 28);
  const absent = evaluateModels(pricing, undefined, {
    category: "Powerful", effort: "max", workload: sampleWorkload
  });
  assert.equal(absent.scoredCount, 0);
  assert.deepEqual(absent.recommendations, []);
});

test("selects long-context prices only above the total prompt threshold", () => {
  const atThreshold = evaluate({
    workload: { uncachedInputTokens: 100000, cachedInputTokens: 100000, cacheWriteTokens: 72000, outputTokens: 1 }
  });
  const above = evaluate({
    workload: { uncachedInputTokens: 100000, cachedInputTokens: 100000, cacheWriteTokens: 72001, outputTokens: 1 }
  });
  const defaultSol = atThreshold.rows.find((row) => row.model === "gpt-6.1-sol");
  const longSol = above.rows.find((row) => row.model === "gpt-6.1-sol");
  assert.equal(defaultSol.rateTier, "Default");
  assert.equal(longSol.rateTier, "Long context");
  assert.ok(Math.abs(defaultSol.workloadCostUsd - 0.39001) < 1e-12);
  assert.ok(Math.abs(longSol.workloadCostUsd - 0.78002) < 1e-12);
  assert.equal(above.rows.find((row) => row.model === "claude-opus-5.5").rateTier, "Default");
});

test("charges write prompt tokens at the input price when no write rate exists", () => {
  const result = evaluate({ category: "Versatile", effort: "high" });
  const gemini = result.rows.find((row) => row.model === "gemini-3.8-flash");
  assert.ok(Math.abs(gemini.workloadCostUsd - 0.023443125) < 1e-12);
});

test("rejects invalid or zero workloads, floors and prices explicitly", () => {
  for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => evaluate({ workload: { ...sampleWorkload, outputTokens: value } }), /token quantities/);
  }
  assert.throws(() => evaluate({ workload: {} }), /token quantities/);
  assert.throws(() => evaluate({
    workload: { uncachedInputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }
  }), /at least one/);
  assert.throws(() => evaluate({
    workload: { ...sampleWorkload, uncachedInputTokens: Number.MAX_SAFE_INTEGER }
  }), /too large/);
  for (const qualityFloor of [0, -1, 1.01, NaN]) {
    assert.throws(() => evaluate({ qualityFloor }), /capability floor/);
  }
  assert.throws(() => evaluate({ category: "Unknown" }), /category/);
  assert.throws(() => evaluateModels([{ model: "bad", category: "Powerful" }], {}, {
    category: "Powerful", effort: "max", workload: sampleWorkload
  }), /Invalid.*price/);
});

test("includes the floor boundary and treats exact value ties as joint recommendations", () => {
  const rates = { inputPerMillionUsd: 1, cachedInputPerMillionUsd: 1, outputPerMillionUsd: 1 };
  const models = ["best", "boundary", "tied"].map((model) => ({ model, category: "Powerful", ...rates }));
  const benchmarks = {
    best: { scores: { max: 100 } },
    boundary: { scores: { max: 85 } },
    tied: { scores: { max: 100 } }
  };
  const result = evaluateModels(models, benchmarks, {
    category: "Powerful", effort: "max", workload: sampleWorkload
  });
  assert.equal(result.rows.find((row) => row.model === "boundary").status, "eligible");
  assert.deepEqual(result.recommendations, ["best", "tied"]);
  assert.deepEqual(evaluate({ qualityFloor: 0.9 }).recommendations, ["claude-opus-5.5"]);
});

test("keeps benchmark evidence auditable and model IDs in the pricing catalog", () => {
  assert.equal(benchmarkSource.url, "https://artificialanalysis.ai/leaderboards/models");
  assert.equal(benchmarkSource.verifiedAt, "2026-10-01");
  for (const [model, benchmark] of Object.entries(modelBenchmarks)) {
    assert.ok(publishedPricingModels.includes(model), model);
    for (const [effort, score] of Object.entries(benchmark.scores)) {
      assert.ok(evaluationEfforts.includes(effort));
      assert.ok(Number.isFinite(score) && score > 0);
    }
    assert.ok(benchmark.configuration);
  }
});

test("calculates GPT-6.1 Sol aliases and both published billing tiers", () => {
  for (const [inputTokens, expectedTier, expectedCost] of [
    [272000, "default", 0.55631], [272001, "long-context", 1.107624]
  ]) {
    const result = calculateSessionCost({
      modelUsage: [{
        model: "GPT-6.1 Sol", inputTokens, cachedInputTokens: 100,
        cacheWriteTokens: 1000, outputTokens: 1000
      }]
    });
    const row = result.modelBreakdown[0];
    assert.equal(row.model, "gpt-6.1-sol");
    assert.equal(row.rateTier, expectedTier);
    assert.ok(Math.abs(row.totalUsd - expectedCost) < 1e-9);
  }
});

test("preserves legacy rates and aliases without putting retired models in the published catalog", () => {
  const legacy = [
    ["claude-sonnet-4.5", "claude sonnet 4.5", 3, 0.3, 3.75, 15],
    ["claude-opus-4.5", "claude opus 4.5", 5, 0.5, 6.25, 25],
    ["claude-opus-4.6", "claude opus 4.6", 5, 0.5, 6.25, 25],
    ["gemini-2.5-pro", "gemini 2.5 pro", 1.25, 0.125, 0, 10],
    ["gemini-3-flash", "gemini 3 flash", 0.5, 0.05, 0, 3],
    ["raptor-mini", "raptor mini", 0.25, 0.025, 0, 2]
  ];
  for (const [model, alias, input, cachedInput, write, output] of legacy) {
    assert.equal(modelAliases[alias], model);
    assert.equal(publishedPricingModels.includes(model), false);
    assert.deepEqual(usageBasedRates[model], {
      tier: "default",
      inputPerMillionUsd: input,
      cachedInputPerMillionUsd: cachedInput,
      cacheWritePerMillionUsd: write,
      outputPerMillionUsd: output
    });
    const result = calculateSessionCost({
      modelUsage: [{ model: alias, inputTokens: 1000, outputTokens: 1000 }]
    });
    assert.equal(result.modelBreakdown[0].model, model);
    assert.ok(Math.abs(result.totalUsd - (input + output) / 1000) < 1e-12);
  }
});
