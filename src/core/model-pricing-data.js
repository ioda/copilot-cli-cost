import { benchmarkSource, modelBenchmarks } from "./benchmarks.js";
import { evaluateModels, sampleWorkload } from "../../.github/extensions/copilot-cli-cost/content/model-evaluation.js";
import {
  modelEquivalents,
  modelMetadata,
  pricingSource,
  publishedPricingModels,
  usageBasedRates
} from "./rates.js";

export function getModelPricingData({
  category = "Powerful",
  effort = "max",
  qualityFloor = 0.85,
  workload = sampleWorkload
} = {}) {
  const modelPricing = publishedPricingModels.map((model) => {
    const rates = usageBasedRates[model];
    return {
      model,
      ...modelMetadata[model],
      equivalentModel: modelEquivalents[model] ?? "—",
      inputPerMillionUsd: rates.inputPerMillionUsd,
      cachedInputPerMillionUsd: rates.cachedInputPerMillionUsd,
      cacheWritePerMillionUsd: rates.cacheWritePerMillionUsd || undefined,
      outputPerMillionUsd: rates.outputPerMillionUsd,
      longContext: rates.longContext
        ? {
            inputPerMillionUsd: rates.longContext.inputPerMillionUsd,
            cachedInputPerMillionUsd: rates.longContext.cachedInputPerMillionUsd,
            cacheWritePerMillionUsd: rates.longContext.cacheWritePerMillionUsd || undefined,
            outputPerMillionUsd: rates.longContext.outputPerMillionUsd,
            thresholdInputTokens: rates.longContext.thresholdInputTokens
          }
        : undefined
    };
  });

  return {
    pricingSource,
    benchmarkSource,
    category,
    effort,
    qualityFloor,
    workload,
    modelPricing,
    modelBenchmarks,
    evaluation: evaluateModels(modelPricing, modelBenchmarks, {
      category,
      effort,
      qualityFloor,
      workload
    })
  };
}
