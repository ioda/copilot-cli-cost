import assert from "node:assert/strict";
import test from "node:test";
import { getModelPricingData } from "../src/core/model-pricing-data.js";
import { benchmarkSource, modelBenchmarks } from "../src/core/benchmarks.js";
import { pricingSource, publishedPricingModels } from "../src/core/rates.js";
import { sampleWorkload } from "../.github/extensions/copilot-cli-cost/content/model-evaluation.js";

test("returns panel pricing and benchmark values with the default evaluation", () => {
  const result = getModelPricingData();
  const gpt = result.modelPricing.find((model) => model.model === "gpt-6.1-sol");

  assert.equal(result.pricingSource, pricingSource);
  assert.equal(result.benchmarkSource, benchmarkSource);
  assert.equal(result.category, "Powerful");
  assert.equal(result.effort, "max");
  assert.deepEqual(result.workload, sampleWorkload);
  assert.deepEqual(result.modelPricing.map(({ model }) => model), publishedPricingModels);
  assert.deepEqual(result.modelBenchmarks, modelBenchmarks);
  assert.equal(gpt.inputPerMillionUsd, 2);
  assert.equal(gpt.longContext.thresholdInputTokens, 272000);
  assert.deepEqual(result.evaluation.recommendations, ["gpt-6.1-sol"]);
});

test("accepts panel category, effort, quality floor, and workload overrides", () => {
  const workload = {
    uncachedInputTokens: 1,
    cachedInputTokens: 0,
    cacheWriteTokens: 0,
    outputTokens: 1
  };
  const result = getModelPricingData({
    category: "Versatile",
    effort: "high",
    qualityFloor: 0.9,
    workload
  });

  assert.equal(result.category, "Versatile");
  assert.equal(result.effort, "high");
  assert.equal(result.qualityFloor, 0.9);
  assert.equal(result.evaluation.contextTokens, 1);
  assert.deepEqual(result.evaluation.recommendations, ["grok-4.7"]);
  assert.throws(() => getModelPricingData({ effort: "unknown" }), /reasoning effort/);
});
