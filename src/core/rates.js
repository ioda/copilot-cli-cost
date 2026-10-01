export const AI_CREDIT_USD = 0.01;
export const TOKENS_PER_MILLION = 1_000_000;

export const planIds = Object.freeze({
  free: "free",
  pro: "pro",
  proPlus: "pro-plus",
  max: "max",
  business: "business",
  enterprise: "enterprise",
  student: "student"
});

export const planAiCreditAllotments = Object.freeze({
  [planIds.free]: aiCreditAllotment({ base: 0 }),
  [planIds.pro]: aiCreditAllotment({ base: 1000, flex: 500 }),
  [planIds.proPlus]: aiCreditAllotment({ base: 3900, flex: 3100 }),
  [planIds.max]: aiCreditAllotment({ base: 10000, flex: 10000 }),
  [planIds.business]: aiCreditAllotment({ base: 1900 }),
  [planIds.enterprise]: aiCreditAllotment({ base: 3900 }),
  [planIds.student]: aiCreditAllotment({ base: 0 })
});

export const planAllowances = Object.freeze({
  aiCredits: Object.freeze(Object.fromEntries(
    Object.entries(planAiCreditAllotments).map(([plan, allotment]) => [plan, allotment.totalAiCredits])
  )),
  promotionalAiCredits: {
    [planIds.business]: 1100,
    [planIds.enterprise]: 3100
  }
});

export const promotionalAllowancePeriod = Object.freeze({
  startsAt: "2026-06-01T00:00:00.000Z",
  endsBefore: "2026-09-01T00:00:00.000Z"
});

export const pricingSource = Object.freeze({
  url: "https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing",
  verifiedAt: "2026-10-01"
});

// Keep the published panel catalog separate from legacy compatibility rates.
export const publishedPricingModels = Object.freeze([
  "gpt-5-mini",
  "gpt-5.3-codex",
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "gpt-5.5",
  "gpt-5.6-luna",
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-6-astra",
  "gpt-6-luna",
  "gpt-6-sol",
  "gpt-6.1-sol",
  "claude-haiku-4.5",
  "claude-sonnet-4",
  "claude-sonnet-4.6",
  "claude-opus-4.7",
  "claude-opus-4.8",
  "claude-opus-4.8-fast",
  "claude-opus-5",
  "claude-opus-5.5",
  "claude-sonnet-5",
  "claude-sonnet-5.5",
  "claude-fable-5",
  "claude-fable-5.1",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "mai-code-1.1-flash",
  "grok-4.5",
  "grok-4.6",
  "grok-4.7",
  "kimi-k2.7-code",
  "kimi-k3"
]);

export const usageBasedRates = Object.freeze({
  "claude-sonnet-4.5": rate({ input: 3, cachedInput: 0.3, cacheWrite: 3.75, output: 15 }),
  "claude-opus-4.5": rate({ input: 5, cachedInput: 0.5, cacheWrite: 6.25, output: 25 }),
  "claude-opus-4.6": rate({ input: 5, cachedInput: 0.5, cacheWrite: 6.25, output: 25 }),
  "gemini-2.5-pro": rate({ input: 1.25, cachedInput: 0.125, output: 10 }),
  "gemini-3-flash": rate({ input: 0.5, cachedInput: 0.05, output: 3 }),
  "raptor-mini": rate({ input: 0.25, cachedInput: 0.025, output: 2 }),
  "gpt-5-mini": rate({ input: 0.25, cachedInput: 0.025, output: 2 }),
  "gpt-5.3-codex": rate({ input: 1.75, cachedInput: 0.175, output: 14 }),
  "gpt-5.4": rate({
    input: 2.5,
    cachedInput: 0.25,
    output: 15,
    longContext: { thresholdInputTokens: 272_000, input: 5, cachedInput: 0.5, output: 22.5 }
  }),
  "gpt-5.4-mini": rate({ input: 0.75, cachedInput: 0.075, output: 4.5 }),
  "gpt-5.4-nano": rate({ input: 0.2, cachedInput: 0.02, output: 1.25 }),
  "gpt-5.5": rate({
    input: 5,
    cachedInput: 0.5,
    output: 30,
    longContext: { thresholdInputTokens: 272_000, input: 10, cachedInput: 1, output: 45 }
  }),
  "gpt-6-astra": rate({
    input: 10,
    cachedInput: 1,
    cacheWrite: 12.5,
    output: 50,
    longContext: { thresholdInputTokens: 272_000, input: 20, cachedInput: 2, cacheWrite: 25, output: 75 }
  }),
  "gpt-6-luna": rate({
    input: 0.1,
    cachedInput: 0.01,
    cacheWrite: 0.125,
    output: 0.5,
    longContext: { thresholdInputTokens: 272_000, input: 0.2, cachedInput: 0.02, cacheWrite: 0.25, output: 0.75 }
  }),
  "gpt-6-sol": rate({
    input: 2,
    cachedInput: 0.2,
    cacheWrite: 2.5,
    output: 10,
    longContext: { thresholdInputTokens: 272_000, input: 4, cachedInput: 0.4, cacheWrite: 5, output: 15 }
  }),
  "gpt-6.1-sol": rate({
    input: 2,
    cachedInput: 0.1,
    cacheWrite: 2.5,
    output: 10,
    longContext: { thresholdInputTokens: 272_000, input: 4, cachedInput: 0.2, cacheWrite: 5, output: 15 }
  }),
  "gpt-5.6-luna": rate({
    input: 0.2,
    cachedInput: 0.02,
    cacheWrite: 0.25,
    output: 1.2,
    longContext: { thresholdInputTokens: 200_000, input: 0.4, cachedInput: 0.04, cacheWrite: 0.5, output: 1.8 }
  }),
  "gpt-5.6-sol": rate({
    input: 4,
    cachedInput: 0.4,
    cacheWrite: 5,
    output: 20,
    longContext: { thresholdInputTokens: 272_000, input: 8, cachedInput: 0.8, cacheWrite: 10, output: 30 }
  }),
  "gpt-5.6-terra": rate({
    input: 2,
    cachedInput: 0.2,
    cacheWrite: 2.5,
    output: 12,
    longContext: { thresholdInputTokens: 272_000, input: 4, cachedInput: 0.4, cacheWrite: 5, output: 18 }
  }),
  "claude-haiku-4.5": rate({ input: 1, cachedInput: 0.1, cacheWrite: 1.25, output: 5 }),
  "claude-sonnet-4": rate({ input: 3, cachedInput: 0.3, cacheWrite: 3.75, output: 15 }),
  "claude-sonnet-4.6": rate({ input: 3, cachedInput: 0.3, cacheWrite: 3.75, output: 15 }),
  "claude-opus-4.7": rate({ input: 5, cachedInput: 0.5, cacheWrite: 6.25, output: 25 }),
  "claude-opus-4.8": rate({ input: 5, cachedInput: 0.5, cacheWrite: 6.25, output: 25 }),
  "claude-opus-4.8-fast": rate({ input: 10, cachedInput: 1, cacheWrite: 12.5, output: 50 }),
  "claude-opus-5": rate({ input: 5, cachedInput: 0.5, cacheWrite: 6.25, output: 25 }),
  "claude-opus-5.5": rate({ input: 4, cachedInput: 0.2, cacheWrite: 5, output: 20 }),
  "claude-sonnet-5": rate({ input: 2, cachedInput: 0.2, cacheWrite: 2.5, output: 10 }),
  "claude-sonnet-5.5": rate({ input: 2, cachedInput: 0.2, cacheWrite: 2.5, output: 10 }),
  "claude-fable-5": rate({ input: 10, cachedInput: 1, cacheWrite: 12.5, output: 50 }),
  "claude-fable-5.1": rate({ input: 10, cachedInput: 0.25, cacheWrite: 12.5, output: 50 }),
  "gemini-3.1-pro": rate({
    input: 2,
    cachedInput: 0.2,
    output: 12,
    longContext: { thresholdInputTokens: 200_000, input: 4, cachedInput: 0.4, output: 18 }
  }),
  "gemini-3.5-flash": rate({ input: 1.5, cachedInput: 0.15, output: 9 }),
  "gemini-3.6-flash": rate({ input: 0.75, cachedInput: 0.075, output: 3.75 }),
  "gemini-3.7-flash": rate({ input: 0.75, cachedInput: 0.075, output: 3.75 }),
  "gemini-3.8-flash": rate({ input: 0.75, cachedInput: 0.075, output: 3.75 }),
  "mai-code-1-flash": rate({ input: 0.75, cachedInput: 0.075, output: 4.5 }),
  "mai-code-1.1-flash": rate({ input: 0.2, cachedInput: 0.02, output: 1.2 }),
  "grok-4.5": rate({
    input: 2,
    cachedInput: 0.5,
    output: 6,
    longContext: { thresholdInputTokens: 200_000, input: 4, cachedInput: 1, output: 12 }
  }),
  "grok-4.6": rate({
    input: 2,
    cachedInput: 0.5,
    output: 6,
    longContext: { thresholdInputTokens: 200_000, input: 4, cachedInput: 1, output: 12 }
  }),
  "grok-4.7": rate({
    input: 2,
    cachedInput: 0.5,
    output: 6,
    longContext: { thresholdInputTokens: 200_000, input: 4, cachedInput: 1, output: 12 }
  }),
  "kimi-k2.7-code": rate({ input: 0.95, cachedInput: 0.19, output: 4 }),
  "kimi-k3": rate({ input: 3, cachedInput: 0.3, output: 15 }),
});

export const modelEquivalents = Object.freeze({
  "gpt-5-mini": "Raptor Mini",
  "gpt-5.3-codex": "Claude Sonnet 4.5",
  "gpt-5.4": "Claude Opus 4.8",
  "gpt-5.4-mini": "MAI Code 1 Flash",
  "gpt-5.4-nano": "GPT-5 mini",
  "gpt-5.5": "GPT-5.6 SOL",
  "gpt-6-astra": "—",
  "gpt-6-luna": "—",
  "gpt-6-sol": "—",
  "gpt-6.1-sol": "—",
  "gpt-5.6-sol": "Claude Opus 4.8",
  "gpt-5.6-luna": "GPT-5 mini",
  "gpt-5.6-terra": "GPT-5.6 SOL",
  "claude-haiku-4.5": "Gemini 3 Flash",
  "claude-sonnet-4": "GPT-5.3 Codex",
  "claude-sonnet-4.6": "GPT-5.3 Codex",
  "claude-opus-4.7": "GPT-5.6 SOL",
  "claude-opus-4.8": "GPT-5.6 SOL",
  "claude-opus-4.8-fast": "Claude Fable 5",
  "claude-opus-5": "GPT-5.6 SOL",
  "claude-opus-5.5": "—",
  "claude-sonnet-5": "GPT-5.6 SOL",
  "claude-sonnet-5.5": "GPT-5.6 SOL",
  "claude-fable-5": "GPT-5.5",
  "gemini-3.1-pro": "GPT-5.4",
  "gemini-3.5-flash": "Claude Sonnet 4.5",
  "gemini-3.6-flash": "MAI Code 1.1 Flash",
  "gemini-3.7-flash": "MAI Code 1.1 Flash",
  "gemini-3.8-flash": "MAI Code 1.1 Flash",
  "mai-code-1-flash": "GPT-5.4 mini",
  "mai-code-1.1-flash": "GPT-5.6 Luna",
  "grok-4.5": "Gemini 3.1 Pro",
  "grok-4.6": "Gemini 3.1 Pro",
  "grok-4.7": "Gemini 3.1 Pro",
  "kimi-k2.7-code": "GPT-5.4 mini",
  "kimi-k3": "Claude Sonnet 5"
});

export const modelMetadata = Object.freeze({
  "gpt-5-mini": { category: "Lightweight", tier: "Default" },
  "gpt-5.3-codex": { category: "Powerful", tier: "Default" },
  "gpt-5.4": { category: "Versatile", tier: "Default" },
  "gpt-5.4-mini": { category: "Lightweight", tier: "Default" },
  "gpt-5.4-nano": { category: "Lightweight", tier: "Default" },
  "gpt-5.5": { category: "Powerful", tier: "Default" },
  "gpt-6-astra": { category: "Powerful", tier: "Default" },
  "gpt-6-luna": { category: "Lightweight", tier: "Default" },
  "gpt-6-sol": { category: "Powerful", tier: "Default" },
  "gpt-6.1-sol": { category: "Powerful", tier: "Default" },
  "gpt-5.6-luna": { category: "Lightweight", tier: "Default" },
  "gpt-5.6-sol": { category: "Powerful", tier: "Default" },
  "gpt-5.6-terra": { category: "Versatile", tier: "Default" },
  "claude-haiku-4.5": { category: "Versatile", tier: "Default" },
  "claude-sonnet-4": { category: "Versatile", tier: "Default" },
  "claude-sonnet-4.6": { category: "Versatile", tier: "Default" },
  "claude-opus-4.7": { category: "Powerful", tier: "Default" },
  "claude-opus-4.8": { category: "Powerful", tier: "Default" },
  "claude-opus-4.8-fast": { category: "Powerful", tier: "Default" },
  "claude-opus-5": { category: "Powerful", tier: "Default" },
  "claude-opus-5.5": { category: "Powerful", tier: "Default" },
  "claude-sonnet-5": { category: "Versatile", tier: "Default" },
  "claude-sonnet-5.5": { category: "Versatile", tier: "Default" },
  "claude-fable-5": { category: "Powerful", tier: "Default" },
  "claude-fable-5.1": { category: "Powerful", tier: "Default" },
  "gemini-3.1-pro": { category: "Powerful", tier: "Default" },
  "gemini-3.5-flash": { category: "Lightweight", tier: "Default" },
  "gemini-3.6-flash": { category: "Versatile", tier: "Default" },
  "gemini-3.7-flash": { category: "Versatile", tier: "Default" },
  "gemini-3.8-flash": { category: "Versatile", tier: "Default" },
  "mai-code-1-flash": { category: "Lightweight", tier: "Default" },
  "mai-code-1.1-flash": { category: "Lightweight", tier: "Default" },
  "grok-4.5": { category: "Versatile", tier: "Default" },
  "grok-4.6": { category: "Versatile", tier: "Default" },
  "grok-4.7": { category: "Versatile", tier: "Default" },
  "kimi-k2.7-code": { category: "Versatile", tier: "Default" },
  "kimi-k3": { category: "Powerful", tier: "Default" }
});

export const modelAliases = Object.freeze({
  "claude sonnet 4.5": "claude-sonnet-4.5",
  "claude opus 4.5": "claude-opus-4.5",
  "claude opus 4.6": "claude-opus-4.6",
  "gemini 2.5 pro": "gemini-2.5-pro",
  "gemini 3 flash": "gemini-3-flash",
  "raptor mini": "raptor-mini",
  "gpt-5 mini": "gpt-5-mini",
  "gpt-5.4 mini": "gpt-5.4-mini",
  "gpt-5.4 nano": "gpt-5.4-nano",
  "gpt-6 astra": "gpt-6-astra",
  "gpt-6 luna": "gpt-6-luna",
  "gpt-6 sol": "gpt-6-sol",
  "gpt-6.1 sol": "gpt-6.1-sol",
  "gpt-5.6 sol": "gpt-5.6-sol",
  "gpt-5.6 luna": "gpt-5.6-luna",
  "gpt-5.6 terra": "gpt-5.6-terra",
  "claude haiku 4.5": "claude-haiku-4.5",
  "claude sonnet 4": "claude-sonnet-4",
  "claude sonnet 4.6": "claude-sonnet-4.6",
  "claude opus 4.7": "claude-opus-4.7",
  "claude opus 4.8": "claude-opus-4.8",
  "claude opus 4.8 fast": "claude-opus-4.8-fast",
  "claude opus 4.8 (fast mode) (preview)": "claude-opus-4.8-fast",
  "claude fable 5": "claude-fable-5",
  "claude fable 5.1": "claude-fable-5.1",
  "claude opus 5": "claude-opus-5",
  "claude opus 5.5": "claude-opus-5.5",
  "claude sonnet 5": "claude-sonnet-5",
  "claude sonnet 5.5": "claude-sonnet-5.5",
  "gemini 3.1 pro": "gemini-3.1-pro",
  "gemini 3.5 flash": "gemini-3.5-flash",
  "gemini 3.6 flash": "gemini-3.6-flash",
  "gemini 3.7 flash": "gemini-3.7-flash",
  "gemini 3.8 flash": "gemini-3.8-flash",
  "goldeneye": "mai-code-1-flash",
  "mai code 1 flash": "mai-code-1-flash",
  "mai code 1.1 flash": "mai-code-1.1-flash",
  "grok 4.5": "grok-4.5",
  "grok 4.6": "grok-4.6",
  "grok 4.7": "grok-4.7",
  "kimi k2.7 code": "kimi-k2.7-code",
  "kimi k3": "kimi-k3"
});

function rate({ input, cachedInput, cacheWrite = 0, output, longContext }) {
  const defaultRate = Object.freeze({
    tier: "default",
    inputPerMillionUsd: input,
    cachedInputPerMillionUsd: cachedInput,
    cacheWritePerMillionUsd: cacheWrite,
    outputPerMillionUsd: output
  });
  if (!longContext) {
    return defaultRate;
  }
  return Object.freeze({
    ...defaultRate,
    longContext: Object.freeze({
      tier: "long-context",
      thresholdInputTokens: longContext.thresholdInputTokens,
      inputPerMillionUsd: longContext.input,
      cachedInputPerMillionUsd: longContext.cachedInput,
      cacheWritePerMillionUsd: longContext.cacheWrite ?? cacheWrite,
      outputPerMillionUsd: longContext.output
    })
  });
}

function aiCreditAllotment({ base, flex = 0 }) {
  return Object.freeze({
    baseAiCredits: base,
    flexAiCredits: flex,
    totalAiCredits: base + flex
  });
}
